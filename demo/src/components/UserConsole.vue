<template>
  <el-container>
    <el-main>
      <el-row :gutter="10">
        <el-col :span="6">
          <el-tag>{{ user }}</el-tag>
        </el-col>
        <el-col :span="9">
          <el-button type="success"　@click="onSaveClicked">データ保存</el-button>
        </el-col>
        <el-col :span="9">
          <el-button type="danger"　@click="onLogOutClicked">ログアウト</el-button>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import hub from '@/hub'

export default {
  props: ['user'],
  data() {
    return {
    }
  },
  methods: {
    onSaveClicked() {
      hub.$emit('save_user_layers')
      hub.$emit('save_search_history')
    },
    onLogOutClicked() {
      hub.$emit('logout_requested')
    }
  }
}
</script>

<style scoped>
</style>
