<template>
  <div>
    <!-- <h2>场景管理</h2> -->
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>场景列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>添加场景
          </el-button>
        </div>
      </template>

      <!-- 添加搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="场景名称">
          <el-input v-model="searchForm.name" placeholder="请输入场景名称" clearable />
        </el-form-item>
        <el-form-item label="紧急联系人">
          <el-input v-model="searchForm.emergencyContact" placeholder="请输入紧急联系人" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table 
        :data="scenes" 
        style="width: 100%" 
        v-loading="loading"
        border
        stripe
        highlight-current-row
      >
        <el-table-column prop="name" label="场景名称" min-width="150" />
        <el-table-column prop="room_x_length" label="房间长度" min-width="100">
          <template #default="scope">
            {{ scope.row.room_x_length }}m
          </template>
        </el-table-column>
        <el-table-column prop="room_y_length" label="房间宽度" min-width="100">
          <template #default="scope">
            {{ scope.row.room_y_length }}m
          </template>
        </el-table-column>
        <el-table-column prop="emergencyContact" label="紧急联系人" min-width="120" />
        <el-table-column prop="family_name" label="所属家庭" min-width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.family_name" type="success">{{ scope.row.family_name }}</el-tag>
            <span v-else class="text-muted">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="设备列表">
          <template #default="scope">
            <el-button size="small" @click="handleViewDevices(scope.row)">查看设备</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button size="small" type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>编辑
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
        <el-form-item label="场景名称">
          <el-input v-model="form.name" placeholder="请输入场景名称" />
        </el-form-item>
        <el-form-item label="房间长度">
          <el-input-number v-model="form.room_x_length" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="房间宽度">
          <el-input-number v-model="form.room_y_length" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="紧急联系人">
          <el-input v-model="form.emergencyContact" placeholder="请输入紧急联系人" />
        </el-form-item>
        <el-form-item label="所属家庭">
          <el-select v-model="form.family_id" placeholder="请选择所属家庭" clearable style="width: 100%">
            <el-option
              v-for="family in allFamilies"
              :key="family.id"
              :label="family.name"
              :value="family.id"
            />
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

    <!-- 设备列表对话框 -->
    <el-dialog
      v-model="deviceDialogVisible"
      title="场景设备列表"
      width="70%"
    >
      <el-table :data="sceneDevices" style="width: 100%">
        <el-table-column prop="name" label="设备名称" />
        <el-table-column prop="mac" label="设备序列号" />
        <el-table-column prop="radarHeight" label="设备高度" />
        <el-table-column prop="downAngle" label="下倾角度" />
        <el-table-column prop="status" label="设备状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox, ElPagination } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'

const scenes = ref([])
const allFamilies = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加场景')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const form = ref({
  name: '',
  room_x_length: 0,
  room_y_length: 0,
  emergencyContact: '',
  family_id: null
})

// 添加搜索表单
const searchForm = ref({
  name: '',
  emergencyContact: ''
})

const deviceDialogVisible = ref(false)
const sceneDevices = ref([])

const fetchScenes = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/scenes', {
      params: {
        name: searchForm.value.name,
        emergency_contact: searchForm.value.emergencyContact,
        page: currentPage.value,
        limit: pageSize.value
      }
    })
    
    if (response.data.code === 200) {
      scenes.value = response.data.data || []
      total.value = Number(response.data.total) || 0
    } else {
      ElMessage.error(response.data.message || '获取场景列表失败')
      scenes.value = []
      total.value = 0
    }
  } catch (error) {
    ElMessage.error('获取场景列表失败')
    scenes.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const fetchAllFamilies = async () => {
  try {
    const response = await axios.get('/api/families/all')
    if (response.data.code === 200) {
      allFamilies.value = response.data.data
    } else {
      console.error('获取家庭列表失败:', response.data.message)
      ElMessage.error('获取家庭列表失败')
    }
  } catch (error) {
    console.error('获取家庭列表失败:', error)
    ElMessage.error('获取家庭列表失败')
  }
}

const handleAdd = () => {
  dialogTitle.value = '添加场景'
  form.value = {
    name: '',
    room_x_length: 0,
    room_y_length: 0,
    emergencyContact: '',
    family_id: null
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑场景'
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该场景吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await axios.delete(`/api/scenes/${row.id}`)
    ElMessage.success('删除成功')
    fetchScenes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除场景失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  try {
    if (form.value.id) {
      await axios.put(`/api/scenes/${form.value.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/scenes', form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchScenes()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  }
}

// 添加搜索方法
const handleSearch = () => {
  fetchScenes()
}

// 添加重置搜索方法
const resetSearch = () => {
  searchForm.value = {
    name: '',
    emergencyContact: ''
  }
  handleSearch()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchScenes()
}

// 查看场景设备列表
const handleViewDevices = async (row) => {
  try {
    const response = await axios.get(`/api/scenes/${row.id}/devices`)
    if (response.data.code === 200) {
      sceneDevices.value = response.data.data
      deviceDialogVisible.value = true
    } else {
      ElMessage.error('获取设备列表失败')
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
    ElMessage.error('获取设备列表失败')
  }
}

onMounted(() => {
  fetchScenes()
  fetchAllFamilies()
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
</style>