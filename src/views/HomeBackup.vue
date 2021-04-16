<template>
  <div>
    <div class="content" :class="(minusTime)?'red':'white'" v-if="itemLength">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <p class="minus" v-if="minusTime">-</p>
      <p class="minutes">{{minusTime?minutesLeft-1:minutesLeft}}</p>
      <p class="colon">:</p>
      <p class="seconds">{{secondsLeft}}</p>
    </div>
    <div class="emptyContent" v-else>
      <div class="loadingText">No Service or just loading...</div>
      <div class="loader"></div>
    </div>
    <p class="nextName" v-if="nextItem!=null">{{nextItem}}</p>
    <p class="name">{{itemName}}</p>
  </div>
</template>
<script>
export default {
  data() {
    return {
      itemName: "",
      minusTime: false,
      itemLength: null,
      timeNow: null,
      startTime: 0,
      plan: null,
      currentItemTime: null,
      nextItem: null
    };
  },
  mounted: function() {
    this.$nextTick(function() {
      window.setInterval(() => {
        this.timeNow = new Date().setTime(new Date().getTime());
      }, 1000);
    });
  },
  computed: {
    timeLeft: function() {
      if (this.itemLength !== null) {
        return this.itemLength + (this.startTime - this.timeNow) / 1000;
      }
    },
    minutesLeft: function() {
      if (this.timeLeft > 60 || this.timeLeft < 60) {
        var timeLeftMinutes = Math.floor(this.timeLeft / 60);
        return Math.abs(timeLeftMinutes);
      }
      return 0;
    },
    secondsLeft: function() {
      if (this.timeLeft !== undefined) {
        if (this.timeLeft > 60 || this.timeLeft < 60) {
          var timeLeftSeconds = Math.floor(this.timeLeft % 60);
          if (timeLeftSeconds < 0) {
            this.minusTime = true;
          } else {
            this.minusTime = false;
          }
          if (Math.floor(Math.abs(timeLeftSeconds)) < 10) {
            return "0" + Math.floor(Math.abs(timeLeftSeconds));
          }
          return Math.floor(Math.abs(timeLeftSeconds));
        }
        if (this.timeLeft < 0) {
          this.minusTime = true;
        } else {
          this.minusTime = false;
        }
        if (Math.floor(Math.abs(this.timeLeft)) < 10) {
          return "0" + Math.floor(Math.abs(this.timeLeft));
        }
        return Math.floor(Math.abs(this.timeLeft));
      }
      return 0;
    }
  },

  created() {
    this.getCurrentPlan();
  },
  methods: {
    async getCurrentPlan() {
      const response = await fetch(
        "https://api.planningcenteronline.com/services/v2/service_types/227874/plans?filter=future&order=sort_date",
        {
          headers: {
            Authorization:
              "Basic MzRmMzY5OWNkMmFkZjc3YmFmOTNlMDJlZjUyYjU3YTYxYjI4MWIyNDcyZjRkZjQwM2E0NDE5ODI3NDM5ZmYyYjpmODBmYmVmNzA2Nzg2NjI4MDY3NTlhOTcyNTBhY2VjMTMxOTFhZGI5Y2Q5NzIxOGY1YjBmYTY0ZDUwYjBlOWVk"
          }
        }
      );
      const plans = await response.json();
      plans.data.forEach(async plan => {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (today - new Date(plan.attributes.dates) == 0) {
          this.plan = plan;
          var timer = setInterval(callTime, 5000);
          var me = this;
          function callTime() {
            me.getCurrentItemTime();
          }
        }
      });
    },
    async getCurrentItemTime() {
      await this.plan;
      if (this.plan != null) {
        const response = await fetch(
          "https://api.planningcenteronline.com/services/v2/service_types/227874/plans/" +
            this.plan.id +
            "/live/current_item_time",
          {
            headers: {
              Authorization:
                "Basic MzRmMzY5OWNkMmFkZjc3YmFmOTNlMDJlZjUyYjU3YTYxYjI4MWIyNDcyZjRkZjQwM2E0NDE5ODI3NDM5ZmYyYjpmODBmYmVmNzA2Nzg2NjI4MDY3NTlhOTcyNTBhY2VjMTMxOTFhZGI5Y2Q5NzIxOGY1YjBmYTY0ZDUwYjBlOWVk"
            }
          }
        );
        var currentItemTime = await response.json();
        if (currentItemTime.errors && currentItemTime.errors[0].status == 404) {
          this.itemLength = null;
        }

        this.startTime = new Date(
          currentItemTime.data.attributes.live_start_at
        );
        var currentItem = currentItemTime.data.relationships.item;
        this.getItems(currentItem.data.id);
      }
    },
    async getItems(itemId) {
      const response = await fetch(
        "https://api.planningcenteronline.com/services/v2/service_types/227874/plans/" +
          this.plan.id +
          "/items",
        {
          headers: {
            Authorization:
              "Basic MzRmMzY5OWNkMmFkZjc3YmFmOTNlMDJlZjUyYjU3YTYxYjI4MWIyNDcyZjRkZjQwM2E0NDE5ODI3NDM5ZmYyYjpmODBmYmVmNzA2Nzg2NjI4MDY3NTlhOTcyNTBhY2VjMTMxOTFhZGI5Y2Q5NzIxOGY1YjBmYTY0ZDUwYjBlOWVk"
          }
        }
      );
      var items = await response.json();
      var item = items.data.filter(item => item.id == itemId)[0];
      this.itemName = item.attributes.title;
      this.itemLength = item.attributes.length;
      var currentItemIndex = items.data.indexOf(item);
      this.nextItem =
        (items.data[currentItemIndex + 1]
          ? items.data[currentItemIndex + 1].attributes.title
          : "") +
        (items.data[currentItemIndex + 2]
          ? " | " + items.data[currentItemIndex + 2].attributes.title
          : "") +
        (items.data[currentItemIndex + 3]
          ? " | " + items.data[currentItemIndex + 3].attributes.title
          : "");
    }
  }
};
</script>
<style>
html,
body {
  height: 100%;
  margin: 0px;
  overflow: hidden;
}
.content {
  font-size: 30vw;
  margin: 0px;
  display: flex;
  background-color: black;
  padding-top: 450px;
}
.emptyContent {
  background-color: black;
  height: 1000px;
}
.white {
  color: white;
}
.red {
  color: red;
}
.minus,
.minutes,
.colon,
.seconds {
  font-family: "Helvetica Neue";
  font-weight: 300;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 400px;
  margin-top: -20vh !important;
}
.name {
  font-family: "Helvetica Neue";
  font-weight: 300;
  height: 30px;
  width: 100%;
  text-align: center;
  margin-left: auto;
  margin-right: auto;
  position: absolute;
  top: -60px;
  color: white;
  font-size: 6vw;
}
.nextName {
  font-family: "Helvetica Neue";
  font-weight: 300;
  height: 30px;
  width: 100%;
  text-align: center;
  margin-left: auto;
  margin-right: auto;
  position: absolute;
  bottom: 80px;
  color: white;
  font-size: 3vw;
}
.loader {
  border: 16px solid #f3f3f3;
    border-top: 16px solid indianred;
    border-radius: 50%;
    width: 34vh;
    height: 34vh;
    -webkit-animation: spin 2s linear infinite;
    animation: spin 2s linear infinite;
    position: absolute;
    margin-left: auto;
    margin-right: auto;
    left: 0;
    right: 0;
    top: 30vh;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.loadingText {
  color: white;
    max-width: 210px;
    font-size: 4vh;
    text-align: center;
    font-family: monospace;
    margin-left: auto;
    margin-right: auto;
    left: 0;
    right: 0;
    top: 41%;
    position: absolute;
    width: 100%;
}
@media only screen and (max-width: 1000px) {

  .name {
    font-family: "Helvetica Neue";
    font-weight: 300;
    height: 30px;
    width: 100%;
    text-align: center;
    margin-left: auto;
    margin-right: auto;
    position: absolute;
    top: 10vh;
    color: white;
    font-size: 5vh;
  }
  .nextName {
    font-family: "Helvetica Neue";
    font-weight: 300;
    height: 30px;
    width: 100vw;
    text-align: center;
    position: absolute;
    bottom: 12vh;
    color: white;
    font-size: 3vh;
  }
}
</style>
