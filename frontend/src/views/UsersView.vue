<template>
  <div>
    <!-- <h2>用户管理</h2> -->
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" @click="handleAdd">添加用户</el-button>
        </div>
      </template>

      <!-- 添加搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.name" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="权限">
          <el-select v-model="searchForm.privileges" placeholder="请选择权限" clearable>
            <el-option label="管理员" :value="0" />
            <el-option label="普通用户" :value="1" />
            <el-option label="已申请" :value="2" />
            <el-option label="被拒绝" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table 
        :data="users" 
        style="width: 100%" 
        v-loading="loading"
        border
        stripe
        highlight-current-row
      >
        <el-table-column prop="name" label="用户名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column prop="privileges" label="权限" min-width="100">
          <template #default="scope">
            <el-tag :type="getPrivilegeType(scope.row.privileges)" effect="dark">
              {{ getPrivilegeText(scope.row.privileges) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button size="small" type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button size="small" type="success" @click="handleAssign(scope.row)">
                <el-icon><Share /></el-icon>分配场景
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          layout="prev, pager, next"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="form.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="权限">
          <el-select v-model="form.privileges" placeholder="请选择权限">
            <el-option label="管理员" :value="0" />
            <el-option label="普通用户" :value="1" />
            <el-option label="已申请" :value="2" />
            <el-option label="被拒绝" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分配用户对话框 -->
    <el-dialog
      title="分配用户"
      v-model="assignUserDialogVisible"
      width="800px"
    >
      <div class="transfer-container">
        <div class="transfer-panel">
          <div class="transfer-header">未分配用户</div>
          <el-table
            :data="unassignedUsers"
            style="width: 100%"
            height="300"
            @selection-change="handleUnassignedSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="用户名" />
            <el-table-column prop="phone" label="手机号" />
          </el-table>
        </div>
        <div class="transfer-buttons">
          <el-button type="primary" @click="moveToAssigned">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button type="primary" @click="moveToUnassigned">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
        </div>
        <div class="transfer-panel">
          <div class="transfer-header">已分配用户</div>
          <el-table
            :data="assignedUsers"
            style="width: 100%"
            height="300"
            @selection-change="handleAssignedSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="用户名" />
            <el-table-column prop="phone" label="手机号" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <!-- 修改为 assignUserDialogVisible -->
          <el-button @click="assignUserDialogVisible = false">取消</el-button> 
          <el-button type="primary" @click="handleAssignSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 分配场景对话框 -->
    <el-dialog
      title="分配场景"
      v-model="assignSceneDialogVisible"
      width="800px"
    >
      <div class="transfer-container">
        <div class="transfer-panel">
          <div class="transfer-header">未分配场景</div>
          <el-table
            :data="unassignedScenes"
            style="width: 100%"
            height="300"
            @selection-change="handleUnassignedSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="场景名称" />
            <!-- 可以根据实际场景数据添加更多列 -->
          </el-table>
        </div>
        <div class="transfer-buttons">
          <el-button type="primary" @click="moveToAssigned">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button type="primary" @click="moveToUnassigned">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
        </div>
        <div class="transfer-panel">
          <div class="transfer-header">已分配场景</div>
          <el-table
            :data="assignedScenes"
            style="width: 100%"
            height="300"
            @selection-change="handleAssignedSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="场景名称" />
            <!-- 可以根据实际场景数据添加更多列 -->
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <!-- 修改为 assignSceneDialogVisible -->
          <el-button @click="assignSceneDialogVisible = false">取消</el-button> 
          <el-button type="primary" @click="handleAssignSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElTable, ElTableColumn, ElButton, ElButtonGroup, ElTag, ElCard, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElDialog, ElPagination } from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'
import { ArrowRight, ArrowLeft, Edit, Share, Delete } from '@element-plus/icons-vue'

const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加用户')
const currentSceneId = ref(null)
const unassignedUsers = ref([])
const assignedUsers = ref([])
const assignUserDialogVisible = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const form = ref({
  name: '',
  phone: '',
  privileges: 1
})

const assignedScenes = ref([])
const unassignedScenes = ref([])
const selectedUnassignedScenes = ref([])
const selectedAssignedScenes = ref([])

// 添加搜索表单
const searchForm = ref({
  name: '',
  phone: '',
  privileges: ''
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/users', {
      params: {
        name: searchForm.value.name,
        phone: searchForm.value.phone,
        privileges: searchForm.value.privileges,
        page: currentPage.value,
        limit: pageSize.value
      }
    })
    
    if (response.data.code === 200) {
      users.value = response.data.data || []
      total.value = Number(response.data.total) || 0
    } else {
      ElMessage.error(response.data.message || '获取用户列表失败')
      users.value = []
      total.value = 0
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    users.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const getPrivilegeType = (privileges) => {
  switch (privileges) {
    case 0:
      return 'success' // 管理员
    case 1:
      return 'info' // 普通用户
    case 2:
      return 'warning' // 已申请
    case 3:
      return 'danger' // 被拒绝
    default:
      return 'info'
  }
}

const getPrivilegeText = (privileges) => {
  switch (privileges) {
    case 0:
      return '管理员'
    case 1:
      return '普通用户'
    case 2:
      return '已申请'
    case 3:
      return '被拒绝'
    default:
      return '未知'
  }
}

const handleAdd = () => {
  dialogTitle.value = '添加用户'
  form.value = {
    name: '',
    phone: '',
    privileges: 1
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑用户'
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await axios.delete(`/api/users/${row.id}`)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  try {
    if (form.value.id) {
      await axios.put(`/api/users/${form.value.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/users', form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchUsers()
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

const assignSceneDialogVisible = ref(false)

const handleAssign = async (row) => {
  currentSceneId.value = row.id
  try {
    // 使用getAllScenes API获取所有场景
    const response = await axios.get('/api/scenes/all')
    const allScenes = response.data.data
    const assignedResponse = await axios.get(`/api/users/${row.id}/assigned`)
    const assignedIds = assignedResponse.data.data.map(scene => scene.id)
    
    assignedScenes.value = allScenes.filter(scene => assignedIds.includes(scene.id))
    unassignedScenes.value = allScenes.filter(scene => !assignedIds.includes(scene.id))
    
    assignSceneDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取场景列表失败')
  }
}

const handleUnassignedSelectionChange = (selection) => {
  selectedUnassignedScenes.value = selection
}

const handleAssignedSelectionChange = (selection) => {
  selectedAssignedScenes.value = selection
}

const moveToAssigned = () => {
  if (selectedUnassignedScenes.value.length === 0) return
  
  assignedScenes.value = [...assignedScenes.value, ...selectedUnassignedScenes.value]
  unassignedScenes.value = unassignedScenes.value.filter(
    scene => !selectedUnassignedScenes.value.some(selected => selected.id === scene.id)
  )
  selectedUnassignedScenes.value = []
}

const moveToUnassigned = () => {
  if (selectedAssignedScenes.value.length === 0) return
  
  unassignedScenes.value = [...unassignedScenes.value, ...selectedAssignedScenes.value]
  assignedScenes.value = assignedScenes.value.filter(
    scene => !selectedAssignedScenes.value.some(selected => selected.id === scene.id)
  )
  selectedAssignedScenes.value = []
}

const handleAssignSubmit = async () => {
  try {
    const assignedIds = assignedScenes.value.map(scene => scene.id)
    await axios.post(`/api/users/${currentSceneId.value}/assign`, {
      sceneIds: assignedIds
    })
    ElMessage.success('场景分配成功')
    assignSceneDialogVisible.value = false
  } catch (error) {
    ElMessage.error('场景分配失败')
  }
}

// 添加搜索方法
const handleSearch = () => {
  fetchUsers()
}

// 添加重置搜索方法
const resetSearch = () => {
  searchForm.value = {
    name: '',
    phone: '',
    privileges: ''
  }
  handleSearch()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchUsers()
}

// 添加组件挂载时的数据获取
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.box-card {
  margin-bottom: 20px;
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

:deep(.el-select) {
  width: 180px;
}

:deep(.el-input) {
  width: 180px;
}

.pagination-container {
  margin-top: 20px;
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border-top: 1px solid #EBEEF5;
}

:deep(.el-pagination) {
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 14px;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next),
:deep(.el-pagination .el-pager li) {
  height: 32px;
  line-height: 32px;
  min-width: 32px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  margin: 0 4px;
  border-radius: 4px;
}

:deep(.el-pagination .el-pager li.active) {
  background-color: #409EFF;
  color: #fff;
  border-color: #409EFF;
}

:deep(.el-pagination .el-pager li:hover) {
  color: #409EFF;
  border-color: #409EFF;
}

.transfer-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.transfer-panel {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.transfer-header {
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  text-align: center;
  font-weight: bold;
}

.transfer-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>