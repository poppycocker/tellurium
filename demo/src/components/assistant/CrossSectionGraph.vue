<script>
import { Line, mixins } from 'vue-chartjs'

export default {
  props: ['chartData', 'resolution', 'index'],
  extends: Line,
  mixins: [mixins.reactiveProp],
  mounted () {
    this.renderChart(this.chartData, {
      tooltips: {
        callbacks: {
          title: (tooltipItems, data) => {
            const y = data.datasets[0].data[tooltipItems[0].index]
            return `${y}m`
          },
          label: (tooltipItem, data) => {
            const x = data.labels[tooltipItem.index]
            const y = data.datasets[0].data[tooltipItem.index]
            return `x: ${x}m, y:${y}m`
          }
        }
      },
      // legend: {
      //   labels: {
      //     fontColor: 'white'
      //   }
      // },
      scales: {
        yAxes: [{
          ticks: {
            // fontColor: 'white',
            beginAtZero: true
          }
        }],
        xAxes: [{
          ticks: {
            // fontColor: 'white',
            stepSize: Math.max(this.resolution * 10, 10),
            beginAtZero: true
          }
        }]
      }
    })
  }
}
</script>
