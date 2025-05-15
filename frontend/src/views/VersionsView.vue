<template>
  <div>
    <!-- <h2>版本管理</h2> -->
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>版本列表</span>
          <el-button type="primary" @click="handleAdd">添加版本</el-button>
        </div>
      </template>
      <el-table :data="versions" style="width: 100%" v-loading="loading">
        <el-table-column prop="versionName" label="版本名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <!-- <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button> -->
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
            <el-button 
              size="small" 
              type="primary" 
              :disabled="!scope.row.fileUrl"
              @click="handleDownload(scope.row)"
            >
              <el-icon><Download /></el-icon>下载
            </el-button>
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
        <el-form-item label="版本名称">
          <el-input v-model="form.versionName" placeholder="请输入版本名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入版本描述"
          />
        </el-form-item>
        <el-form-item label="版本文件">
          <el-upload
            class="upload-demo"
            drag
            :action="`${config.API_BASE_URL}/api/versions/upload`"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :limit="1"
            :file-list="fileList"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .bin、.zip、.rar、.7z 格式文件，且不超过 50MB
              </div>
            </template>
          </el-upload>
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
import { ElMessage, ElMessageBox, ElPagination } from 'element-plus'
import axios from 'axios'
import { Search, Refresh, Edit, Delete, UploadFilled, Download } from '@element-plus/icons-vue'
import config from '../../config.json'

const versions = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加版本')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const form = ref({
  versionName: '',
  description: '',
  fileUrl: '',
  fileName: '' // 新增 fileName 字段，用于存储文件名
})
const fileList = ref([])

const fetchVersions = async () => {
  console.log('开始获取版本列表'); // 检查方法是否调用
  loading.value = true
  try {
    const response = await axios.get('/api/versions', {
      params: {
        page: currentPage.value,
        limit: pageSize.value
      }
    })
    console.log('版本列表响应:', response); // 检查响应数据
    if (response.data.code === 200) {
      versions.value = response.data.data || []
      total.value = Number(response.data.total) || 0
    } else {
      ElMessage.error(response.data.message || '获取版本列表失败')
      versions.value = []
      total.value = 0
    }
  } catch (error) {
    console.log('获取版本列表错误:', error); // 检查是否出错
    ElMessage.error('获取版本列表失败')
    versions.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleAdd = async () => {
  // 清空 form 中的 fileUrl 和 fileName
  dialogTitle.value = '添加版本';
  form.value = {
    versionName: '',
    description: '',
    fileUrl: '',
    fileName: ''
  };
  fileList.value = []; // 清空文件列表
  dialogVisible.value = true;
};

const handleUploadSuccess = (response, file, fileList) => {
  form.value.fileUrl = response.data.fileUrl;
  form.value.fileName = file.name; // 存储文件名
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑版本'
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该版本吗？', '提示', {
      type: 'warning'
    })
    await axios.delete(`/api/versions/${row.id}`)
    ElMessage.success('删除成功')
    fetchVersions()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  try {
    if (form.value.id) {
      await axios.put(`/api/versions/${form.value.id}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/versions', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchVersions()
  } catch (error) {
    ElMessage.error(form.value.id ? '更新失败' : '创建失败')
  }
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchVersions()
}

const handleUploadError = (error) => {
  // 处理上传失败后的逻辑
  ElMessage.error('上传失败')
}

const beforeUpload = (file) => {
  // 处理上传前的逻辑
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('上传文件大小不能超过 50MB')
  }
  return isLt50M
}

// 处理文件下载
const handleDownload = (row) => {
    if (!row.fileUrl) {
        ElMessage.warning('该版本没有可下载的文件');
        return;
    }

    // 从 fileUrl 中提取文件名（假设 fileUrl 格式为 "/upload/versions/xxx.bin"）
    const fileName = row.fileUrl.split('/').pop(); 
    if (!fileName) {
        ElMessage.warning('文件路径无效');
        return;
    }

    // 构造下载接口地址（确保与后端路由匹配）
    const downloadUrl = `${config.RESOURCE_URL}${encodeURIComponent(fileName)}`;

    // 创建临时 a 标签触发下载
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName; // 使用原始文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

onMounted(() => {
  fetchVersions()
})
</script>

<style scoped>
.version-management {
  padding: 20px;
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

:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409EFF;
}

:deep(.el-icon--upload) {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

:deep(.el-upload__text) {
  color: #606266;
  font-size: 14px;
  text-align: center;
}

:deep(.el-upload__text em) {
  color: #409EFF;
  font-style: normal;
}

:deep(.el-upload__tip) {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  text-align: center;
}

:deep(.el-upload-list) {
  margin-top: 16px;
}

:deep(.el-upload-list__item) {
  transition: all 0.3s;
}

:deep(.el-upload-list__item:hover) {
  background-color: #f5f7fa;
}
</style>