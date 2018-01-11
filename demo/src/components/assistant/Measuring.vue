<template>
  <el-container>
    <el-main>
      <el-row>
        <el-col>総距離: {{ fixedTotal }} {{ unit }}</el-col>
      </el-row>
      <el-row v-for='(crossSectionResult, i) in crossSectionResults' :key="i">
        <el-col>
          <cross-section-graph :chartData="crossSectionResult" :resolution="crossSectionResolution" :index="i" />
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
import hub from '@/hub'
import TelluriumUtil from 'TelluriumUtil'
import CrossSectionGraph from '@/components/assistant/CrossSectionGraph'

export default {
  props: ['mode'],
  data() {
    return {
      total: 0.0,
      shape: [],
      crossSectionResults: [],
      crossSectionResolution: 100
    }
  },
  computed: {
    fixedTotal() {
      const t = this.total
      return t < 10000.0 ? t.toFixed(0) : (t / 1000).toFixed(1)
    },
    unit() {
      return this.total < 10000.0 ? 'm' : 'km'
    },
    shape4326() {
      return this.shape.map(TelluriumUtil.to4326).map(coord => {
        return {
          lat: coord[0].toFixed(2),
          lng: coord[1].toFixed(2)
        }
      })
    }
  },
  mounted() {
    hub.$on('measuring_started', this.onReceiveMeasuringEvent)
    hub.$on('measure_point_added', this.onReceiveMeasuringEvent)
    hub.$on('measuring_finished', this.onReceiveMeasuringEvent)
    hub.$on('analyze_crosssection_finished', this.onAnalyzeCrossSectionFinished)
  },
  methods: {
    onReceiveMeasuringEvent(evt) {
      this.total = evt.total
      this.shape = evt.shape
    },
    onAnalyzeCrossSectionFinished(results, resolution) {
      this.crossSectionResolution = resolution
      this.crossSectionResults = results.map(this.generateChartData)
    },
    generateChartData(coords, i, results) {
      return {
        labels: coords.map((coord, i) => Math.round(i * this.crossSectionResolution)),
        datasets: [{
          label: `Path#${i + 1}/${results.length}`,
          backgroundColor: '#f87979',
          data: coords.map(coord => +coord[2].toFixed(0)),
          pointRadius: 0
        }]
      }
    }
  },
  components: {
    CrossSectionGraph
  }
}
</script>

<style scoped>
</style>
