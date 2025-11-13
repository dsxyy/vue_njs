<template>
    <div>
    <el-card class="box-card">
        <template #header>
            <div class="card-header">
                <span>设备列表</span>
            </div>
        </template>

        <div class="search-container" style="margin-bottom: 20px">
            <el-input v-model="searchParams.device_id" placeholder="设备序列号" style="width: 200px; margin-right: 10px"
                clearable />
            <el-input v-model="searchParams.name" placeholder="设备名称" style="width: 200px; margin-right: 10px"
                clearable />
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="success" @click="handleCreate" style="margin-left: 10px;">新增设备</el-button>
        </div>

        <div class="scroll-container">
            <el-table :data="devices" style="width: 150%" v-loading="loading">
                <el-table-column prop="name" label="设备名称" />
                <el-table-column prop="status" label="设备状态">
                    <template #default="scope">
                        <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                            {{ scope.row.status === 1 ? '在线' : '离线' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="device_id" label="设备序列号" width="180" />
                <el-table-column prop="heigth" label="设备高度" />
                <el-table-column prop="width" label="设备宽度" />
                <el-table-column label="操作" width="280">
                    <template #default="scope">
                        <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                        <el-button size="small" type="primary" @click="handleView(scope.row)">查看</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <div class="pagination-container">
            <el-pagination layout="prev, pager, next" :total="total" :current-page="currentPage" :page-size="pageSize"
                @current-change="handleCurrentChange" />
        </div>
    </el-card>

    <!-- 编辑设备对话框 -->
    <el-dialog v-model="dialogVisible" title="编辑设备" width="50%">
        <el-form :model="deviceForm" label-width="120px">
            <el-form-item label="设备名称">
                <el-input v-model="deviceForm.name" />
            </el-form-item>
            <el-form-item label="设备序列号">
                <el-input v-model="deviceForm.device_id" :disabled="isEditMode" />
            </el-form-item>
            <el-form-item label="设备高度">
                <el-input v-model="deviceForm.heigth" />
            </el-form-item>
            <el-form-item label="设备度宽度">
                <el-input v-model="deviceForm.width" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">确定</el-button>
            </span>
        </template>
    </el-dialog>
    <!-- 查看对话框 -->
    <el-dialog v-model="viewDialogVisible" title="查看设备" width="800px">
      <el-form :model="deviceForm" label-width="120px">
            <el-form-item label="设备名称">
                <el-input v-model="deviceForm.name" disabled />
            </el-form-item>
            <el-form-item label="设备序列号">
                <el-input v-model="deviceForm.mac" disabled />
            </el-form-item>
            <el-form-item label="设备高度">
                <el-input v-model="deviceForm.heigth" disabled />
            </el-form-item>
            <el-form-item label="设备度宽度">
                <el-input v-model="deviceForm.width" disabled />
            </el-form-item>
        </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
// import { Warning } from '@element-plus/icons-vue'

const dialogTitle = ref('新增设备') // 用于动态设置对话框标题
const isEditMode = ref(false)      // 用于区分是新增(false)还是编辑(true)
const devices = ref([])
const scenes = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchParams = ref({
    device_id: '',
    name: ''
})

const deviceForm = ref({
    id: null, // 必须有id，用于编辑
    name: '',
    device_id: '',
    heigth: '',
    width: '',
    status: 1,
})


const downloadDialogVisible = ref(false)
const selectedDate = ref('')
// 重置表单为空白状态
const resetForm = () => {
    deviceForm.value = {
        id: null,
        name: '',
        device_id: '',
        heigth: '',
        width: '',
        status: 1,
    }
}
// “新增设备”按钮的点击事件
const handleCreate = () => {
    resetForm() // 重置表单
    dialogTitle.value = '新增设备'
    isEditMode.value = false
    dialogVisible.value = true // 打开对话框
}

// // 告警信息相关变量
// const warnsDialogVisible = ref(false)
// const warnsDate = ref('')
// const deviceWarns = ref([])
// const warnsLoading = ref(false)
// const currentDeviceForWarns = ref(null)

// const disabledDate = (time) => {
//     const today = new Date()
//     const fiveDaysAgo = new Date(today)
//     fiveDaysAgo.setDate(today.getDate() - 5)

//     // 格式化为YYYY-M-DD（不带前导零）
//     const formatDate = (date) => {
//         return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
//     }

//     const timeDate = new Date(time)
//     return timeDate > today || timeDate < fiveDaysAgo
// }

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


const fetchDevices = async () => {
    loading.value = true
    try {
        const response = await axios.get('/api/breathe', {
            params: {
                page: currentPage.value,
                pageSize: pageSize.value,
                ...searchParams.value
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

const handleEdit = (row) => {
    deviceForm.value = { ...row }
    dialogTitle.value = '编辑设备' 
    isEditMode.value = true
    dialogVisible.value = true
}

const handleView = (row) => {
    deviceForm.value = { ...row }
    viewDialogVisible.value = true
}

const handleSubmit = async () => {
    try {
        let response;
        if (isEditMode.value) {
            // --- 编辑模式 (PUT) ---
            response = await axios.put(`/api/breathe/${deviceForm.value.id}`, deviceForm.value)
        } else {
            // --- 新增模式 (POST) ---
            response = await axios.post('/api/breathe', deviceForm.value)
        }
        // (后端返回 200 (OK) 或 201 (Created) 都算成功)
        if (response.data.code === 200 || response.data.code === 201) {
            ElMessage.success(isEditMode.value ? '更新成功' : '新增成功')
            dialogVisible.value = false
            fetchDevices() // 刷新列表
            } else {
                ElMessage.error(isEditMode.value ? '更新失败' : '新增失败')
            }
        } catch (error) {
            console.error('提交失败:', error)
        let message = '提交失败';
        
        // 【重要】显示后端返回的错误信息，例如 "device_id 已存在"
        if (error.response && error.response.data && error.response.data.message) {
            message = error.response.data.message;
        }
        ElMessage.error(message)
     }
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
            const response = await axios.delete(`/api/breathe/${row.id}`)
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


const handleSearch = () => {
    currentPage.value = 1
    fetchDevices()
}

const handleReset = () => {
    searchParams.value = {
        device_id: '',
        name: ''
    }
    currentPage.value = 1
    fetchDevices()
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
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.search-container {
    display: flex;
    align-items: center;
    gap: 10px;
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

.warns-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.no-data {
    text-align: center;
    padding: 40px 0;
}

.scroll-container {
    overflow-x: auto;
    margin-bottom: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>