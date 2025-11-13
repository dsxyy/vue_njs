<template>
    <div>
    <el-card class="box-card">
        <template #header>
            <div class="card-header">
                <span>设备列表</span>
            </div>
        </template>

        <div class="search-container" style="margin-bottom: 20px">
            <el-input v-model="searchParams.mac" placeholder="设备序列号" style="width: 200px; margin-right: 10px"
                clearable />
            <el-input v-model="searchParams.name" placeholder="设备名称" style="width: 200px; margin-right: 10px"
                clearable />
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
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
                <el-table-column prop="mac" label="设备序列号" width="180" />
                <el-table-column prop="version" label="版本" />
                <el-table-column prop="radarHeight" label="设备高度" />
                <el-table-column prop="downAngle" label="下倾角度" />
                <el-table-column prop="scene_name" label="所属场景" />
                <el-table-column label="短信推送" width="90">
                    <template #default="scope">
                        <el-switch v-model="scope.row.is_sendMessage" :active-value="1" :inactive-value="0" disabled />
                    </template>
                </el-table-column>
                <el-table-column label="挥手触发" width="90">
                    <template #default="scope">
                        <el-switch v-model="scope.row.wave_trigger" :active-value="1" :inactive-value="0" disabled />
                    </template>
                </el-table-column>
                <el-table-column label="跌倒触发" width="90">
                    <template #default="scope">
                        <el-switch v-model="scope.row.fall_trigger" :active-value="1" :inactive-value="0" disabled />
                    </template>
                </el-table-column>
                <el-table-column label="趟地检测" width="90">
                    <template #default="scope">
                        <el-switch v-model="scope.row.LongLayDetect" :active-value="1" :inactive-value="0" disabled />
                    </template>
                </el-table-column>
                <el-table-column label="设备自校准" width="100">
                    <template #default="scope">
                        <el-switch v-model="scope.row.SelfCalib" :active-value="1" :inactive-value="0" disabled />
                    </template>
                </el-table-column>
                <el-table-column label="语言" width="80">
                    <template #default="scope">
                        <el-tag :type="scope.row.language === 'zh' ? 'primary' : 'success'">
                            {{ scope.row.language === 'zh' ? '中文' : scope.row.language === 'en' ? '英文' : scope.row.language }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="350">
                    <template #default="scope">
                        <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                        <el-button size="small" type="primary" @click="handleDownloadData(scope.row)">下载数据</el-button>
                        <el-button size="small" type="warning" @click="handleViewWarns(scope.row)">
                            <el-icon><Warning /></el-icon>告警信息
                        </el-button>
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
                <el-input v-model="deviceForm.mac" disabled />
            </el-form-item>
            <el-form-item label="设备高度">
                <el-input v-model="deviceForm.radarHeight" />
            </el-form-item>
            <el-form-item label="下倾角度">
                <el-input v-model="deviceForm.downAngle" />
            </el-form-item>
            <el-form-item label="短信推送">
                <el-switch v-model="deviceForm.is_sendMessage" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="挥手触发">
                <el-switch v-model="deviceForm.wave_trigger" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="跌倒触发">
                <el-switch v-model="deviceForm.fall_trigger" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="趟地检测">
                <el-switch v-model="deviceForm.LongLayDetect" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="设备自校准">
                <el-switch v-model="deviceForm.SelfCalib" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="语言">
                <el-select v-model="deviceForm.language" placeholder="请选择语言">
                    <el-option label="中文" value="zh" />
                    <el-option label="英文" value="en" />
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

    <!-- 下载数据对话框 -->
    <el-dialog v-model="downloadDialogVisible" title="选择下载日期" width="30%">
        <el-date-picker v-model="selectedDate" type="date" placeholder="选择日期" :disabled-date="disabledDate"
            value-format="YYYY-M-D" style="width: 100%" />
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="downloadDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleDownload">确定</el-button>
            </span>
        </template>
    </el-dialog>

    <!-- 告警信息对话框 -->
    <el-dialog v-model="warnsDialogVisible" title="设备告警信息" width="70%">
        <div class="warns-header">
            <el-date-picker 
                v-model="warnsDate" 
                type="date" 
                placeholder="选择查询日期" 
                value-format="YYYY-MM-DD" 
                style="width: 200px; margin-right: 10px"
                @change="handleWarnsDateChange"
            />
            <el-button type="primary" @click="fetchDeviceWarns">查询</el-button>
        </div>
        
        <el-table :data="deviceWarns" style="width: 100%; margin-top: 20px" v-loading="warnsLoading">
            <el-table-column prop="starttime" label="开始时间" min-width="150" />
            <el-table-column prop="endtime" label="结束时间" min-width="150" />
            <el-table-column prop="content" label="告警内容" min-width="200" />
            <el-table-column prop="currenttime" label="记录时间" min-width="150" />
        </el-table>
        
        <div v-if="deviceWarns.length === 0 && !warnsLoading" class="no-data">
            <el-empty description="暂无告警信息" />
        </div>
    </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { Warning } from '@element-plus/icons-vue'

const devices = ref([])
const scenes = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchParams = ref({
    mac: '',
    name: ''
})

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
    radar_version: 1,
    SelfCalib: 1,
    language: 'zh'
})


const downloadDialogVisible = ref(false)
const selectedDate = ref('')

// 告警信息相关变量
const warnsDialogVisible = ref(false)
const warnsDate = ref('')
const deviceWarns = ref([])
const warnsLoading = ref(false)
const currentDeviceForWarns = ref(null)

const disabledDate = (time) => {
    const today = new Date()
    const fiveDaysAgo = new Date(today)
    fiveDaysAgo.setDate(today.getDate() - 5)

    // 格式化为YYYY-M-DD（不带前导零）
    const formatDate = (date) => {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }

    const timeDate = new Date(time)
    return timeDate > today || timeDate < fiveDaysAgo
}

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
        const response = await axios.get('/api/devices', {
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
    dialogVisible.value = true
}

const handleSubmit = async () => {
    try {
        const response = await axios.put(`/api/devices/${deviceForm.value.id}`, deviceForm.value)
        if (response.data.code === 200) {
            ElMessage.success('更新成功')
            dialogVisible.value = false
            fetchDevices()
        } else {
            ElMessage.error('更新失败')
        }
    } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('提交失败')
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


const handleSearch = () => {
    currentPage.value = 1
    fetchDevices()
}

const handleReset = () => {
    searchParams.value = {
        mac: '',
        name: ''
    }
    currentPage.value = 1
    fetchDevices()
}

const currentDevice = ref(null)

const handleDownloadData = (device) => {
    currentDevice.value = device
    selectedDate.value = ''
    downloadDialogVisible.value = true
}

const handleDownload = async () => {
    if (!selectedDate.value || !currentDevice.value) {
        ElMessage.warning('请选择日期')
        return
    }

    try {
        // 保持与后端一致的路径格式：YYYY-M-DD
        const formattedDate = selectedDate.value
        const fileUrl = `https://mmradar.inchitech.com/data/${currentDevice.value.mac}/${formattedDate}.tar.gz`
        // 创建下载链接
        const link = document.createElement('a')
        link.href = fileUrl
        const fileName = `${currentDevice.value.mac}_${formattedDate}.tar.gz`
        link.setAttribute('download', fileName)
        console.log(link)
        document.body.appendChild(link)
        link.click()

        setTimeout(() => {
            document.body.removeChild(link)
        }, 100)

        ElMessage.success('下载链接已创建')

        downloadDialogVisible.value = false
    } catch (error) {
        console.error('下载数据失败:', error)
        ElMessage.error(`下载失败: ${error.message}`)
    }
}

// 查看告警信息
const handleViewWarns = (device) => {
    currentDeviceForWarns.value = device
    warnsDate.value = new Date().toISOString().split('T')[0] // 默认选择今天
    deviceWarns.value = []
    warnsDialogVisible.value = true
    fetchDeviceWarns()
}

// 获取设备告警信息
const fetchDeviceWarns = async () => {
    if (!currentDeviceForWarns.value || !warnsDate.value) {
        ElMessage.warning('请选择查询日期')
        return
    }

    warnsLoading.value = true
    try {
        const response = await axios.get('/api/devices/warns', {
            params: {
                deviceId: currentDeviceForWarns.value.mac,
                date: warnsDate.value
            }
        })
        
        if (response.data.code === 200) {
            deviceWarns.value = response.data.data || []
            if (deviceWarns.value.length === 0) {
                ElMessage.info('该日期暂无告警信息')
            }
        } else {
            ElMessage.error(response.data.message || '获取告警信息失败')
            deviceWarns.value = []
        }
    } catch (error) {
        console.error('获取告警信息失败:', error)
        ElMessage.error('获取告警信息失败')
        deviceWarns.value = []
    } finally {
        warnsLoading.value = false
    }
}

// 告警日期变化处理
const handleWarnsDateChange = () => {
    if (warnsDate.value) {
        fetchDeviceWarns()
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
