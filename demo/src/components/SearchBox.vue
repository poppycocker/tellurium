<template>
  <el-container>
    <el-main>
      <el-row>
        <el-col :span="24">
          <el-autocomplete
            v-model="query"
            :fetch-suggestions="querySearchAsync"
            placeholder="検索(Nominatim)"
            @select="handleSelect">
            <i class="el-icon-search el-input__icon" slot="suffix" />
            <template slot-scope="props">
              <img v-if="props.item.icon" :src="props.item.icon">
              {{ props.item.display_name }}
            </template>
          </el-autocomplete>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import hub from '@/hub'

export default {
  props: ['user', 'history', 'queryFromParent'],
  data() {
    return {
      query: '',
      result: []
    }
  },
  mounted() {
    this.query = this.queryFromParent || ''
  },
  methods: {
    querySearchAsync(query, callback) {
      if (!query) {
        this.$emit('setlocation', null)
        callback(this.history.map(h => ({
          display_name: h.query,
          lon: h.lon,
          lat: h.lat
        })))
        return
      }
      hub.$emit('geocoding_requested', query, (result) => {
        if (result.success) {
          callback(result.data || [])
        } else {
          hub.$emit('error', result.error)
        }
      }, this)
    },
    handleSelect(item) {
      this.query = item.display_name
      this.$emit('setlocation', item)
    },
  }
}
</script>

<style scoped>
</style>
