<template>
  <div>
    <b-row>
      <b-col>
        <b-dropdown id="dropdown-1" :text="dropDownText" class="m-md-2">
          <b-dropdown-item
            v-for="plan in plans"
            :key="plan.id"
            @click="onDropDownClick(plan)"
            >{{ plan.attributes.dates }}</b-dropdown-item
          >
        </b-dropdown></b-col
      ><b-col cols="9">
        <b-form-input
          v-model="singer"
          placeholder="Namen eingeben"
        ></b-form-input>
      </b-col>
      <b-col
        ><b-button variant="success" @click="addNameToList">+</b-button>
      </b-col>
    </b-row>

    <b-list-group>
      <b-list-group-item
        variant="secondary"
        v-for="singer in singers"
        :key="singer"
        >{{ singer }}
        <b-badge
          @click="singers.splice(singers.indexOf(singer), 1)"
          variant="danger"
          pill
          >x</b-badge
        ></b-list-group-item
      >
    </b-list-group>

    <b-table striped hover :items="items" :fields="fields">
      <template #cell(title)="items">{{ items.item.attributes.title }}</template>
      <template #cell(firstVoice)="items">{{ items.item.attributes.firstVoice }}</template>
      <template #cell(firstVoicePick)="data">
        <b-dropdown id="dropdown-singer" text="Erste Stimme wählen">
          <b-dropdown-item
            v-for="singer in singers"
            :key="singer"
            @click="addToFirstVoices(data, singer)"
            >{{ singer }}
          </b-dropdown-item>
        </b-dropdown>
      </template>
    </b-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      plans: [],
      dropDownText: "Gottesdienst wählen",
      items: [],
      fields: [
        { key: "title", label: "Titel" },
        { key: "firstVoice", label: "Stimmen" },
        { key: "firstVoicePick", label: "Erste Stimme" },
      ],
      singer: "",
      singers: [],
    };
  },
  created() {
    this.getSundayPlans();
  },
  methods: {
    async getSundayPlans() {
      const response = await fetch(
        "https://api.planningcenteronline.com/services/v2/service_types/227874/plans?filter=future&order=sort_date",
        {
          headers: {
            Authorization:
              "Basic MzRmMzY5OWNkMmFkZjc3YmFmOTNlMDJlZjUyYjU3YTYxYjI4MWIyNDcyZjRkZjQwM2E0NDE5ODI3NDM5ZmYyYjpmODBmYmVmNzA2Nzg2NjI4MDY3NTlhOTcyNTBhY2VjMTMxOTFhZGI5Y2Q5NzIxOGY1YjBmYTY0ZDUwYjBlOWVk",
          },
        }
      );
      const plans = await response.json();
      this.plans = plans.data;
    },
    onDropDownClick(plan) {
      this.dropDownText = plan.attributes.dates;
      this.getSongs(plan.id);
    },
    addNameToList() {
      this.singers.push(this.singer);
      this.singer = "";
    },
    addToFirstVoices(data, singer) {
      this.items[data.index].attributes.firstVoice = singer;
      console.log(this.items);
    },
    async getSongs(planId) {
      const response = await fetch(
        "https://api.planningcenteronline.com/services/v2/service_types/227874/plans/" +
          planId +
          "/items",
        {
          headers: {
            Authorization:
              "Basic MzRmMzY5OWNkMmFkZjc3YmFmOTNlMDJlZjUyYjU3YTYxYjI4MWIyNDcyZjRkZjQwM2E0NDE5ODI3NDM5ZmYyYjpmODBmYmVmNzA2Nzg2NjI4MDY3NTlhOTcyNTBhY2VjMTMxOTFhZGI5Y2Q5NzIxOGY1YjBmYTY0ZDUwYjBlOWVk",
          },
        }
      );
      const items = await response.json();
      this.items = items.data.filter(
        (item) => item.attributes.item_type == "song"
      );
      console.log(this.items);
    },
  },
};
</script>

<style>
</style>
