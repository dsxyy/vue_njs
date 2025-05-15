<template>
  <div class="devices-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>设备列表</span>
          <el-button type="primary" @click="handleAdd">添加设备</el-button>
        </div>
      </template>

      <el-table :data="devices" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="设备名称" />
        <el-table-column prop="status" label="设备状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mac" label="设备序列号" />
        <el-table-column prop="version" label="版本" />
        <el-table-column prop="radarHeight" label="设备高度" />
        <el-table-column prop="downAngle" label="下倾角度" />
        <el-table-column prop="scene_name" label="所属场景" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 添加/编辑设备对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加设备' : '编辑设备'"
      width="50%"
    >
      <el-form :model="deviceForm" label-width="120px">
        <el-form-item label="设备名称">
          <el-input v-model="deviceForm.name" />
        </el-form-item>
        <el-form-item label="设备序列号">
          <el-input v-model="deviceForm.mac" :disabled="dialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="设备高度">
          <el-input v-model="deviceForm.radarHeight" />
        </el-form-item>
        <el-form-item label="下倾角度">
          <el-input v-model="deviceForm.downAngle" />
        </el-form-item>
        <el-form-item label="所属场景" v-if="dialogType === 'add'">
          <el-select v-model="deviceForm.sceneId" placeholder="请选择场景" @change="handleSceneChange">
            <el-option
              v-for="scene in scenes"
              :key="scene.id"
              :label="scene.name"
              :value="scene.id"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const devices = ref([])
const scenes = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const deviceForm = ref({
  name: '',
  mac: '',
  radarHeight: '',
  downAngle: '',
  status: 1,
  version: '',
  isUpdate: 0,
  percentage: 100,
  bgimg: '',
  sceneId: null,
  azi_angle: '',
  x_location: 0,
  y_location: 0,
  deltaX_room: 0,
  deltaY_room: 0,
  radar_version: 1
})

// 获取场景列表
const fetchScenes = async () => {
  try {
    const response = await axios.get('/api/scenes/all')
    if (response.data.code === 200) {
      scenes.value = response.data.data
    } else {
      ElMessage.error('获取场景列表失败')
    }
  } catch (error) {
    console.error('获取场景列表失败:', error)
    ElMessage.error('获取场景列表失败')
  }
}

// 处理场景选择变化
const handleSceneChange = (sceneId) => {
  const selectedScene = scenes.value.find(scene => scene.id === sceneId)
  if (selectedScene) {
    deviceForm.value.deltaX_room = selectedScene.room_x_length
    deviceForm.value.deltaY_room = selectedScene.room_y_length
  }
}

const fetchDevices = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/devices', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    if (response.data.code === 200) {
      devices.value = response.data.data.items
      total.value = Number(response.data.data.total) || 0
    } else {
      ElMessage.error('获取设备列表失败')
      total.value = 0
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
    ElMessage.error('获取设备列表失败')
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogType.value = 'add'
  deviceForm.value = {
    name: '',
    mac: '',
    radarHeight: '',
    downAngle: '',
    status: 1,
    version: '',
    isUpdate: 0,
    percentage: 100,
    bgimg: '',
    sceneId: null,
    azi_angle: '',
    x_location: 0,
    y_location: 0,
    deltaX_room: 0,
    deltaY_room: 0,
    radar_version: 1
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  deviceForm.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除这个设备吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/devices/${row.id}`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchDevices()
      } else {
        ElMessage.error('删除失败')
      }
    } catch (error) {
      console.error('删除设备失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleSubmit = async () => {
  try {
    if (dialogType.value === 'add') {
      const response = await axios.post('/api/devices', deviceForm.value)
      if (response.data.code === 200) {
        ElMessage.success('添加成功')
        dialogVisible.value = false
        fetchDevices()
      } else {
        ElMessage.error('添加失败')
      }
    } else {
      const response = await axios.put(`/api/devices/${deviceForm.value.id}`, deviceForm.value)
      if (response.data.code === 200) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        fetchDevices()
      } else {
        ElMessage.error('更新失败')
      }
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  }
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchDevices()
}

onMounted(() => {
  fetchDevices()
  fetchScenes()
})
</script>

<style scoped>
.devices-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 