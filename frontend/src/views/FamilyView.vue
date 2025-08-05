<template>
  <div>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>家庭列表</span>
          <el-button type="primary" @click="handleAdd">添加家庭</el-button>
        </div>
      </template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="家庭名称">
          <el-input v-model="searchForm.name" placeholder="请输入家庭名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="families" style="width: 100%" v-loading="loading" border stripe highlight-current-row>
        <el-table-column prop="name" label="家庭名称" min-width="120" />
        <el-table-column label="房间列表" min-width="200">
          <template #default="scope">
            <el-tag v-for="scene in scope.row.scenes" :key="scene.id" class="user-tag" effect="dark">
              {{ scene.name }}
            </el-tag>
            <span v-if="!scope.row.scenes || scope.row.scenes.length === 0">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="创建者" min-width="120">
          <template #default="scope">
            <el-tag type="success">{{ scope.row.owner?.name || '未知' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="共享者" min-width="200">
          <template #default="scope">
            <el-tag v-for="user in scope.row.sharedUsers" :key="user.id" class="user-tag" effect="dark">
              {{ user.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button size="small" type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button size="small" type="success" @click="handleManageUsers(scope.row)">
                <el-icon><Share /></el-icon>成员管理
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
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="家庭名称">
          <el-input v-model="form.name" placeholder="请输入家庭名称" />
        </el-form-item>
        <el-form-item label="创建者">
          <el-select v-model="form.ownerId" placeholder="请选择创建者">
            <el-option v-for="user in allUsers" :key="user.id" :label="user.name" :value="user.id" />
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
    <!-- 成员管理对话框 -->
    <el-dialog title="成员管理" v-model="userDialogVisible" width="600px">
      <el-form label-width="100px">
        <el-form-item label="选择共享者">
          <el-select v-model="selectedUsers" multiple placeholder="请选择用户" style="width: 100%">
            <el-option v-for="user in allUsers" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUserSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { Edit, Share, Delete } from '@element-plus/icons-vue'

const families = ref([])
const allUsers = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加家庭')
const userDialogVisible = ref(false)
const selectedUsers = ref([])
const currentFamilyId = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const form = ref({
  name: '',
  ownerId: ''
})
const searchForm = ref({
  name: ''
})

const fetchFamilies = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/families', {
      params: {
        name: searchForm.value.name,
        page: currentPage.value,
        limit: pageSize.value
      }
    })
    if (response.data.code === 200) {
      families.value = response.data.data || []
      total.value = Number(response.data.total) || 0
    } else {
      ElMessage.error(response.data.message || '获取家庭列表失败')
      families.value = []
      total.value = 0
    }
  } catch (error) {
    ElMessage.error('获取家庭列表失败')
    families.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const fetchAllUsers = async () => {
  try {
    const response = await axios.get('/api/users/all')
    if (response.data.code === 200) {
      allUsers.value = response.data.data
    } else {
      ElMessage.error('获取用户列表失败')
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  }
}

const handleAdd = () => {
  dialogTitle.value = '添加家庭'
  form.value = { name: '', ownerId: '' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑家庭'
  form.value = { ...row, ownerId: row.owner?.id || '' }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该家庭吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await axios.delete(`/api/families/${row.id}`)
    ElMessage.success('删除成功')
    fetchFamilies()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  try {
    if (form.value.id) {
      await axios.put(`/api/families/${form.value.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/families', form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchFamilies()
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

const handleManageUsers = (row) => {
  currentFamilyId.value = row.id
  selectedUsers.value = row.sharedUsers.map(user => user.id)
  userDialogVisible.value = true
}

const handleUserSubmit = async () => {
  try {
    await axios.post(`/api/families/${currentFamilyId.value}/users`, {
      userIds: selectedUsers.value
    })
    ElMessage.success('成员分配成功')
    userDialogVisible.value = false
    fetchFamilies()
  } catch (error) {
    ElMessage.error('成员分配失败')
  }
}

const handleSearch = () => {
  fetchFamilies()
}

const resetSearch = () => {
  searchForm.value = { name: '' }
  handleSearch()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchFamilies()
}

onMounted(() => {
  fetchFamilies()
  fetchAllUsers()
})
</script>

<style scoped>
.box-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-form {
  margin-bottom: 20px;
}
.user-tag {
  margin-right: 5px;
  margin-bottom: 5px;
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
</style> 