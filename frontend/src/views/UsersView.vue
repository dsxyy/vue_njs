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
		<el-table-column prop="countryCode" label="区号" min-width="150">
          <template #default="{ row }">
            <span v-if="row.countryCode">
              {{ getCountryDisplayName(row.countryCode) }}
            </span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150">
          <template #default="scope">
            <span v-if="scope.row.remark">{{ scope.row.remark }}</span>
            <span v-else style="color: #999;">暂无备注</span>
          </template>
        </el-table-column>
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
              <el-button size="small" type="success" @click="handleViewFamilies(scope.row)">
                <el-icon><House /></el-icon>查看家庭
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
          <div style="display: flex; gap: 8px;">
            <el-select 
              v-model="form.countryIso2" 
              @change="handleCountryChanged"
              style="width: 150px;"
              placeholder="选择国家"
            >
              <el-option 
                v-for="(code, iso2) in countryCodeMap" 
                :key="iso2" 
                :label="`${countryNameMap[iso2]} (+${code})`" 
                :value="iso2"
              />
            </el-select>
            <el-input 
              v-model="form.phone" 
              placeholder="请输入手机号"
              style="flex: 1;"
            />
          </div>
        </el-form-item>
        <el-form-item label="区号">
          <el-input v-model="form.countryCode" placeholder="区号" readonly />
		</el-form-item>
        <el-form-item label="权限">
          <el-select v-model="form.privileges" placeholder="请选择权限">
            <el-option label="管理员" :value="0" />
            <el-option label="普通用户" :value="1" />
            <el-option label="已申请" :value="2" />
            <el-option label="被拒绝" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看家庭对话框 -->
    <el-dialog
      title="用户家庭信息"
      v-model="viewFamiliesDialogVisible"
      width="800px"
    >
      <div v-if="userFamilies.length === 0" class="no-families">
        <el-empty description="该用户暂无家庭信息" />
      </div>
      <div v-else class="families-list">
        <el-card v-for="family in userFamilies" :key="family.id" class="family-card">
          <template #header>
            <div class="family-header">
              <span class="family-name">{{ family.name }}</span>
              <el-tag :type="family.userRole === 0 ? 'success' : 'info'" size="small">
                {{ family.userRoleText }}
              </el-tag>
            </div>
          </template>
          <div class="family-content">
            <div class="family-info">
              <p><strong>创建者：</strong>{{ family.owner?.name || '未知' }}</p>
              <p><strong>成员：</strong>
                <el-tag v-for="user in family.sharedUsers" :key="user.id" size="small" class="member-tag">
                  {{ user.name }}
                </el-tag>
                <span v-if="family.sharedUsers.length === 0">无</span>
              </p>
              <p><strong>房间：</strong>
                <span v-for="scene in family.scenes" :key="scene.id" class="scene-tag-wrapper">
                  <el-tag size="small" type="warning" class="scene-tag">{{ scene.name }}</el-tag>
                  <el-button size="small" type="primary" @click="handleViewDevices(scene)" style="margin-left: 6px;" plain>查看设备</el-button>
                </span>
                <span v-if="family.scenes.length === 0">无</span>
              </p>
            </div>
          </div>
        </el-card>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewFamiliesDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 已删除冗余设备弹窗，只保留表格弹窗 -->

    <!-- 设备列表弹窗 -->
    <el-dialog
      :title="`房间设备列表 - ${currentSceneName}`"
      v-model="deviceDialogVisible"
      width="700px"
    >
      <div v-if="sceneDevices.length === 0">
        <el-empty description="该房间暂无设备" />
      </div>
      <el-table v-else :data="sceneDevices" style="width: 100%" border stripe>
        <el-table-column prop="name" label="设备名称" min-width="120" />
        <el-table-column prop="mac" label="设备序列号" min-width="150" />
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" min-width="100" />
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deviceDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElTable, ElTableColumn, ElButton, ElButtonGroup, ElTag, ElCard, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElDialog, ElPagination, ElEmpty } from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'
import { Edit, Delete, House } from '@element-plus/icons-vue'
import { countryCodeMap, countryNameMap, getCountryName } from '../utils/countryCodeMap.js'

const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加用户')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const form = ref({
  name: '',
  phone: '',
  countryCode: '86',
  countryIso2: 'cn',
  privileges: 1,
  remark: ''
})

// 添加搜索表单
const searchForm = ref({
  name: '',
  phone: '',
  privileges: ''
})

// 查看家庭相关变量
const viewFamiliesDialogVisible = ref(false)
const userFamilies = ref([])
const currentUserId = ref(null)

// 设备弹窗相关变量
const deviceDialogVisible = ref(false)
const sceneDevices = ref([])
const currentSceneName = ref('')

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

// 处理国家变化
const handleCountryChanged = (iso2) => {
  if (iso2) {
    form.value.countryCode = countryCodeMap[iso2] || '86'
    form.value.countryIso2 = iso2
    console.log('国家变化:', iso2, '区号:', form.value.countryCode)
  }
}

// 获取国家显示名称（用于列表显示）
const getCountryDisplayName = (countryCode) => {
  if (!countryCode) return '-'
  
  // 根据区号查找对应的国家ISO2代码
  const iso2 = Object.keys(countryCodeMap).find(key => countryCodeMap[key] === countryCode)
  if (iso2) {
    const countryName = countryNameMap[iso2] || '未知国家'
    return `${countryName} (+${countryCode})`
  }
  
  // 如果找不到对应的国家，直接显示区号
  return `+${countryCode}`
}

const handleAdd = () => {
  dialogTitle.value = '添加用户'
  form.value = {
    name: '',
    phone: '',
    countryCode: '86',
    countryIso2: 'cn',
    privileges: 1,
    remark: ''
  }
  dialogVisible.value = true
}


const handleEdit = (row) => {
  dialogTitle.value = '编辑用户'
  form.value = { ...row }
  // 如果数据库中有countryCode，需要反向查找对应的countryIso2
  if (row.countryCode) {
    const countryIso2 = Object.keys(countryCodeMap).find(key => countryCodeMap[key] === row.countryCode) || 'cn'
    form.value.countryIso2 = countryIso2
  } else {
    form.value.countryCode = '86'
    form.value.countryIso2 = 'cn'
  }
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

const handleViewFamilies = async (row) => {
  currentUserId.value = row.id
  try {
    const response = await axios.get(`/api/users/${row.id}/families`)
    if (response.data.code === 200) {
      userFamilies.value = response.data.data
      viewFamiliesDialogVisible.value = true
    } else {
      ElMessage.error(response.data.message || '获取家庭列表失败')
    }
  } catch (error) {
    ElMessage.error('获取家庭列表失败')
  }
}

// 查看房间设备方法
const handleViewDevices = async (scene) => {
  try {
    const response = await axios.get(`/api/scenes/${scene.id}/devices`)
    if (response.data.code === 200) {
      sceneDevices.value = response.data.data
      currentSceneName.value = scene.name
      deviceDialogVisible.value = true
    } else {
      ElMessage.error('获取设备列表失败')
    }
  } catch (error) {
    ElMessage.error('获取设备列表失败')
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

/* 查看家庭对话框样式 */
.no-families {
  text-align: center;
  padding: 40px 0;
}

.families-list {
  max-height: 400px;
  overflow-y: auto;
}

.family-card {
  margin-bottom: 16px;
}

.family-card:last-child {
  margin-bottom: 0;
}

.family-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.family-name {
  font-weight: bold;
  font-size: 16px;
}

.family-content {
  padding: 8px 0;
}

.family-info p {
  margin: 8px 0;
  line-height: 1.5;
}

.member-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.scene-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.scene-tag-wrapper {
  display: inline-flex;
  align-items: center;
}

/* 查看设备对话框样式 */
.no-devices {
  text-align: center;
  padding: 40px 0;
}

.devices-list {
  max-height: 400px;
  overflow-y: auto;
}

.device-card {
  margin-bottom: 16px;
}

.device-card:last-child {
  margin-bottom: 0;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-name {
  font-weight: bold;
  font-size: 16px;
}

.device-content {
  padding: 8px 0;
}

.device-info p {
  margin: 8px 0;
  line-height: 1.5;
}
</style>