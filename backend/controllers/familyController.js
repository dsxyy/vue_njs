const pool = require('../config/database');

const familyController = {
  // 获取家庭列表（分页+搜索）
  getFamilies: async (req, res) => {
    try {
      const { name, page = 1, limit = 10 } = req.query;
      let whereClause = 'WHERE del_flag = 0';
      const params = [];
      if (name) {
        whereClause += ' AND name LIKE ?';
        params.push(`%${name}%`);
      }
      const offset = (page - 1) * limit;
      // 总数
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM family_info ${whereClause}`,
        params
      );
      const total = countResult[0].total;
      // 分页数据
      const [rows] = await pool.query(
        `SELECT * FROM family_info ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );
      // 查询每个家庭的创建者和共享者
      for (const family of rows) {
        // 创建者
        const [ownerRows] = await pool.query(
          `SELECT u.id, u.name FROM user_family_info uf JOIN user_info u ON uf.user_id = u.id WHERE uf.family_id = ? AND uf.privileges = 0 AND uf.del_flag = 0`,
          [family.id]
        );
        family.owner = ownerRows[0] || null;
        family.ownerId = family.owner ? family.owner.id : null;
        // 共享者
        const [sharedRows] = await pool.query(
          `SELECT u.id, u.name FROM user_family_info uf JOIN user_info u ON uf.user_id = u.id WHERE uf.family_id = ? AND uf.privileges = 1 AND uf.del_flag = 0`,
          [family.id]
        );
        family.sharedUsers = sharedRows;
        // 所属房间
        const [scenes] = await pool.query(
          'SELECT id, name FROM scene_info WHERE family_id = ?',
          [family.id]
        );
        family.scenes = scenes;
      }
      res.json({ code: 200, message: '获取家庭列表成功', data: rows, total });
    } catch (error) {
      res.status(500).json({ code: 500, message: '获取家庭列表失败', error: error.message });
    }
  },

  // 创建新家庭
  createFamily: async (req, res) => {
    try {
      const { name, ownerId } = req.body;
      // 新建家庭
      const [result] = await pool.query(
        'INSERT INTO family_info (name) VALUES (?)',
        [name]
      );
      const familyId = result.insertId;
      // 绑定创建者为owner
      if (ownerId) {
        await pool.query(
          'INSERT INTO user_family_info (user_id, family_id, privileges, del_flag) VALUES (?, ?, 0, 0) ON DUPLICATE KEY UPDATE del_flag=0, privileges=0',
          [ownerId, familyId]
        );
      }
      res.status(201).json({ code: 200, id: familyId, message: '家庭创建成功' });
    } catch (error) {
      res.status(500).json({ code: 500, message: '创建家庭失败', error: error.message });
    }
  },

  // 更新家庭信息
  updateFamily: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, ownerId } = req.body;
      await pool.query(
        'UPDATE family_info SET name = ? WHERE id = ?',
        [name, id]
      );
      if (ownerId) {
        // 先将所有owner置为del_flag=1
        await pool.query(
          'UPDATE user_family_info SET del_flag = 1 WHERE family_id = ? AND privileges = 0',
          [id]
        );
        // 再插入/恢复新owner
        await pool.query(
          'INSERT INTO user_family_info (user_id, family_id, privileges, del_flag) VALUES (?, ?, 0, 0) ON DUPLICATE KEY UPDATE del_flag=0, privileges=0',
          [ownerId, id]
        );
        
        // 如果更新了创建者，也需要同步更新 scene_user_info 表
        // 获取该家庭下的所有房间
        const [scenes] = await pool.query(
          'SELECT id FROM scene_info WHERE family_id = ? AND del_flag = 0',
          [id]
        );
        
        // 先删除该家庭下所有房间的旧创建者关联
        for (const scene of scenes) {
          await pool.query(
            'UPDATE scene_user_info SET del_flag = 1 WHERE scene_id = ?',
            [scene.id]
          );
        }
        
        // 为每个房间添加新的创建者关联
        for (const scene of scenes) {
          // 检查是否已存在该房间和创建者的关联
          const [existingRows] = await pool.query(
            'SELECT * FROM scene_user_info WHERE scene_id = ? AND userid = ?',
            [scene.id, ownerId]
          );
          
          if (existingRows.length > 0) {
            // 恢复关联
            await pool.query(
              'UPDATE scene_user_info SET del_flag = 0 WHERE scene_id = ? AND userid = ?',
              [scene.id, ownerId]
            );
          } else {
            // 新增关联
            await pool.query(
              'INSERT INTO scene_user_info (scene_id, userid, del_flag) VALUES (?, ?, 0)',
              [scene.id, ownerId]
            );
          }
        }
      }
      res.json({ code: 200, message: '家庭信息更新成功' });
    } catch (error) {
      res.status(500).json({ code: 500, message: '更新家庭信息失败', error: error.message });
    }
  },

  // 删除家庭
  deleteFamily: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query(
        'UPDATE family_info SET del_flag = 1 WHERE id = ?',
        [id]
      );
      // 级联删除 user_family_info
      await pool.query(
        'UPDATE user_family_info SET del_flag = 1 WHERE family_id = ?',
        [id]
      );
      
      // 获取该家庭下的所有房间，并清理 scene_user_info 表
      const [scenes] = await pool.query(
        'SELECT id FROM scene_info WHERE family_id = ?',
        [id]
      );
      
      // 删除该家庭下所有房间的用户关联
      for (const scene of scenes) {
        await pool.query(
          'UPDATE scene_user_info SET del_flag = 1 WHERE scene_id = ?',
          [scene.id]
        );
      }
      
      res.json({ code: 200, message: '删除成功' });
    } catch (error) {
      res.status(500).json({ code: 500, message: '删除失败', error: error.message });
    }
  },

  // 获取单个家庭详情
  getFamilyById: async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM family_info WHERE id = ? AND del_flag = 0', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ code: 404, message: '家庭不存在' });
      }
      const family = rows[0];
      // 创建者
      const [ownerRows] = await pool.query(
        `SELECT u.id, u.name FROM user_family_info uf JOIN user_info u ON uf.user_id = u.id WHERE uf.family_id = ? AND uf.privileges = 0 AND uf.del_flag = 0`,
        [family.id]
      );
      family.owner = ownerRows[0] || null;
      family.ownerId = family.owner ? family.owner.id : null;
      // 共享者
      const [sharedRows] = await pool.query(
        `SELECT u.id, u.name FROM user_family_info uf JOIN user_info u ON uf.user_id = u.id WHERE uf.family_id = ? AND uf.privileges = 1 AND uf.del_flag = 0`,
        [family.id]
      );
      family.sharedUsers = sharedRows;
      // 所属房间
      const [scenes] = await pool.query(
        'SELECT id, name FROM scene_info WHERE family_id = ?',
        [family.id]
      );
      family.scenes = scenes;
      res.json({ code: 200, data: family });
    } catch (error) {
      res.status(500).json({ code: 500, message: '获取家庭详情失败', error: error.message });
    }
  },

  // 获取家庭成员
  getFamilyUsers: async (req, res) => {
    try {
      const { id } = req.params;
      // 创建者
      const [ownerRows] = await pool.query(
        `SELECT u.id, u.name FROM user_family_info uf JOIN user_info u ON uf.user_id = u.id WHERE uf.family_id = ? AND uf.privileges = 0 AND uf.del_flag = 0`,
        [id]
      );
      // 共享者
      const [sharedRows] = await pool.query(
        `SELECT u.id, u.name FROM user_family_info uf JOIN user_info u ON uf.user_id = u.id WHERE uf.family_id = ? AND uf.privileges = 1 AND uf.del_flag = 0`,
        [id]
      );
      res.json({ code: 200, data: { owner: ownerRows[0] || null, sharedUsers: sharedRows } });
    } catch (error) {
      res.status(500).json({ code: 500, message: '获取家庭成员失败', error: error.message });
    }
  },

  // 获取所有家庭列表（不分页，用于分配功能）
  getAllFamilies: async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, name FROM family_info WHERE del_flag = 0 ORDER BY id DESC'
      );
      
      res.json({
        code: 200,
        message: '获取家庭列表成功',
        data: rows
      });
    } catch (error) {
      console.error('获取家庭列表失败:', error);
      res.status(500).json({ 
        code: 500,
        message: '获取家庭列表失败', 
        error: error.message 
      });
    }
  },

  // 更新家庭成员（共享者）
  updateFamilyUsers: async (req, res) => {
    try {
      const { id } = req.params;
      const { userIds } = req.body; // 共享者id数组
      
      // 获取该家庭下的所有房间
      const [scenes] = await pool.query(
        'SELECT id FROM scene_info WHERE family_id = ? AND del_flag = 0',
        [id]
      );
      
      // 先将所有共享者del_flag=1
      await pool.query(
        'UPDATE user_family_info SET del_flag = 1 WHERE family_id = ? AND privileges = 1',
        [id]
      );
      
      // 再批量插入/恢复共享者
      for (const userId of userIds) {
        // 检查是否已存在
        const [rows] = await pool.query(
          'SELECT * FROM user_family_info WHERE user_id = ? AND family_id = ? AND privileges = 1',
          [userId, id]
        );
        if (rows.length > 0) {
          // 恢复
          await pool.query(
            'UPDATE user_family_info SET del_flag = 0 WHERE user_id = ? AND family_id = ? AND privileges = 1',
            [userId, id]
          );
        } else {
          // 新增
          await pool.query(
            'INSERT INTO user_family_info (user_id, family_id, privileges, del_flag) VALUES (?, ?, 1, 0)',
            [userId, id]
          );
        }
      }
      
      // 更新 scene_user_info 表以保持老版本兼容性
      // 先删除该家庭下所有房间的旧用户关联
      for (const scene of scenes) {
        await pool.query(
          'UPDATE scene_user_info SET del_flag = 1 WHERE scene_id = ?',
          [scene.id]
        );
      }
      
      // 为每个房间添加新的用户关联
      for (const scene of scenes) {
        for (const userId of userIds) {
          // 检查是否已存在该房间和用户的关联
          const [existingRows] = await pool.query(
            'SELECT * FROM scene_user_info WHERE scene_id = ? AND userid = ?',
            [scene.id, userId]
          );
          
          if (existingRows.length > 0) {
            // 恢复关联
            await pool.query(
              'UPDATE scene_user_info SET del_flag = 0 WHERE scene_id = ? AND userid = ?',
              [scene.id, userId]
            );
          } else {
            // 新增关联
            await pool.query(
              'INSERT INTO scene_user_info (scene_id, userid, del_flag) VALUES (?, ?, 0)',
              [scene.id, userId]
            );
          }
        }
      }
      
      res.json({ code: 200, message: '成员分配成功' });
    } catch (error) {
      res.status(500).json({ code: 500, message: '成员分配失败', error: error.message });
    }
  }
};

module.exports = familyController; 