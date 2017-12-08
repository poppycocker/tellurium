<template>
  <el-container v-loading="isProcessing">
    <el-main v-if="!isModeRouting">
      <el-row>
        <el-col :span="24">
          <search-box :history="history" @setlocation="onLocationSet" />
        </el-col>
      </el-row>
    </el-main>
    <el-main v-if="isModeRouting">
      <el-row>
        <el-col :span="18">
          <el-switch
              style="display: block"
              v-model="isPedestrian"
              active-color="#409eff"
              inactive-color="#34FF76"
              active-text="歩行者"
              inactive-text="自動車"
              @change="startRouting" />
        </el-col>
        <el-col :span="6">
          <el-button icon="el-icon-circle-close" @click="cancelRouting" round />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="4">
          <i class="el-icon-location" />
        </el-col>
        <el-col :span="20">
          <search-box :history="history" :queryFromParent="queryForDeparture" @setlocation="onDepartureSet" />
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="4">
          <i class="el-icon-location-outline" />
        </el-col>
        <el-col :span="20">
          <search-box :history="history" @setlocation="onDestinationSet" />
        </el-col>
      </el-row>
      <el-row v-for="(instruction, i) in instructions" :key="i" :gutter="10">
        <el-col :span="2">{{ i + 1 }}</el-col>
        <el-col :span="16">
          <a class="instruction-text" @click="onClickInstruction(instruction)">{{ instruction.text }}</a>
        </el-col>
        <el-col :span="6">{{ instruction.distance.toFixed(0) }}m</el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import TelluriumUtil from 'TelluriumUtil'
import hub from '@/hub'
import SearchBox from '@/components/SearchBox'
import dataStore from '@/dataStore'

export default {
  props: ['user'],
  data() {
    return {
      isProcessing: false,
      queryForDeparture: '',
      isPedestrian: false,
      isModeRouting: false,
      departure: null,
      destination: null,
      instructions: [],
      history: []
    }
  },
  mounted() {
    dataStore.loadSearchHistory(this.user).then(data => {
      this.history = data || []
    }).catch(err => {
      hub.$emit('error', `検索履歴の読み込みに失敗しました: ${err}`)
    })
    hub.$on('save_search_history', this.saveHistory)
  },
  components: {
    SearchBox
  },
  methods: {
    onLocationSet(item) {
      if (item) {
        this.flyTo(item)
        this.queryForDeparture = item.display_name
        this.onDepartureSet(item)
        this.isModeRouting = true
        this.addToHistory(item)
      }
    },
    onDepartureSet(item) {
      this.departure = item
      if (item) {
        this.flyTo(item)
        this.startRouting()
        this.addToHistory(item)
      }
    },
    onDestinationSet(item) {
      this.destination = item
      if (item) {
        this.flyTo(item)
        this.startRouting()
        this.addToHistory(item)
      }
    },
    onClickInstruction(instruction) {
      const from = instruction.interval[0]
      const to = instruction.interval[1]
      hub.$emit('instruction_selected', from, to)
    },
    flyTo(item) {
      const coord3857 = TelluriumUtil.to3857([+item.lon, +item.lat])
      hub.$emit('flyto_requested', coord3857, true)
    },
    startRouting() {
      if (!this.departure || !this.destination) {
        return
      }
      const points = [this.departure, this.destination].map(item => {
        return `${item.lat},${item.lon}`
      })
      const vehicleType = this.isPedestrian ? 'foot' : 'car'
      this.isProcessing = true
      hub.$emit('routing_requested', points, vehicleType, result => {
        this.isProcessing = false
        if (result.success) {
          const path = result.data.paths[0]
          this.instructions = path.instructions
        } else {
          hub.$emit('error', result.error)
        }
      }, this)
    },
    cancelRouting() {
      this.instructions = []
      this.queryForDeparture = ''
      this.departure = null
      this.destination = null
      this.isModeRouting = false
      hub.$emit('routing_cancelled')
    },
    addToHistory(item) {
      const query = item.display_name
      const idxExisting = this.history.findIndex(h => h.query === query)
      // 末尾に挿入(既存のものは削除)
      if (idxExisting !== -1) {
        this.history.splice(idxExisting, 1)
      }
      this.history.unshift({
        query: query,
        lon: +item.lon,
        lat: +item.lat
      })
      // 一定数に収める
      while (this.history.length > 10) {
        this.history.pop()
      }
    },
    saveHistory() {
      dataStore.saveSearchHistory(this.history, this.user).then(() => {
        hub.$emit('info', '検索履歴を保存しました')
      }).catch(err => {
        hub.$emit('error', `検索履歴の保存に失敗しました: ${err}`)
      })
    }
  }
}
</script>

<style scoped>
.instruction-text:hover {
  cursor: pointer;
  color: orange;
}
</style>