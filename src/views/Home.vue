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

    <b-table ref="songTable" striped hover :items="items" :fields="fields">
      <template #cell(title)="items">{{
        items.item.attributes.title
      }}</template>
      <template #cell(firstVoice)="items">{{
        items.item.attributes.firstVoice
      }}</template>
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
    <b-button variant="info" @click="exportPDF">Export to PDF</b-button>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default {
  data() {
    return {
      plans: [],
      dropDownText: "Gottesdienst wählen",
      planId: "",
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
      this.planId = plan.id;
      this.getSongs();
    },
    addNameToList() {
      this.singers.push(this.singer);
      this.singer = "";
    },
    addToFirstVoices(data, singer) {
      this.items[data.index].attributes.firstVoice = singer;
      this.$refs.songTable.refresh();
    },
    async exportPDF() {
      var songs = [];
      this.items.forEach((item) =>
        songs.push([
          item.attributes.title,
          item.attributes.firstVoice ? item.attributes.firstVoice : "",
        ])
      );

      const doc = new jsPDF();

      doc.text("Sänger: ", 14, 10);
      doc.setFontSize(14);
      doc.text(this.singers, 14, 18);

      doc.autoTable({
        head: [["Titel", "Erste Stimme"]],
        margin: { top: this.singers.length * 10 + 15 },
        body: songs,
      });
      var pdf = doc.output("blob");
      var blob = new Blob([pdf], { type: "application/pdf" });

      var formData = new FormData();

      formData.append("file", blob, "blob.pdf");
      console.log(formData);
      doc.save("a4.pdf");

      const uploadRes = await fetch(
        "https://upload.planningcenteronline.com/v2/files",
        {
          headers: {
            Authorization:
              "Basic MzRmMzY5OWNkMmFkZjc3YmFmOTNlMDJlZjUyYjU3YTYxYjI4MWIyNDcyZjRkZjQwM2E0NDE5ODI3NDM5ZmYyYjpmODBmYmVmNzA2Nzg2NjI4MDY3NTlhOTcyNTBhY2VjMTMxOTFhZGI5Y2Q5NzIxOGY1YjBmYTY0ZDUwYjBlOWVk",
          },
          body: formData,
          method: "POST",
        }
      );
      const uploadData = await uploadRes.json();
      const uid = uploadData.data[0].id;

      fetch(
        "https://services.planningcenteronline.com/files/upload?item_type=PlanBase&item_id=" +
          this.planId,
        {
          body: "file%5Bid%5D=" + uid,
          headers: {
            Accept: "*/*",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Sec-Ch-Ua":
              '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Set-Cookie":
              "_ga=GA1.2.542467271.1618602085; _gid=GA1.2.616928862.1618602085; filePins=%7B%7D; legacy_plans=0; planning_center_session=eyJhbGciOiJFUzI1NiJ9.eyJqdGkiOiJkYTY4MWQwNzQzZWNiYzIyNmNkNjY1YjlkNDk3ZGQ0ZCIsImlhdCI6MTYxODY1NjE4OSwiZXhwIjoxNjE5ODY1Nzg5LCJpc3MiOiIvcGNvL3Nlc3Npb24ifQ.sEYEtMOA-PU3BQ68dggeQVSDUAVCxmN6WZdIduxTSY4TP-O9trobcIjh9RsrlBAM-hO9Lb8p5gQApBBnc6GQtQ; _account_center_session=Ty9PNEhNcG1ndmhZR3pPclFsYUVtcTdibzk5a0l1Ykh3WElQOEgrbkw1VEhqQWFLUWtIaHNKUmpvTHNQMjA3eGgzWm1Kc1dXZ1hBZnY0Zm1TNnA2bjUraVF3ZnFwUWE2MUozQ0tFUEFTMERxcEhrWFdIbDIvcEhQRU1UQW9uSU9zdUpPdDlZdURoTFUwMkljUWNmeDh2S2phYm5BSnhISjBoQy90RkNQN0FGZ1NnSmgrOStCZDlKYmJsNXlIZ0lIUEVkanF3SVpwZjJHKzRVZjJFMnZrUVgvbkJ5SEJMWHYxdFhlUklTeHloK0RtYWVyRWtZdXZ4NXpXc1RqMm5rbkg2a0kyMElacjM0QUdjdEVRWkNEN05ZaFlTRHV1Uk02SVc2UmNHSGVMakVveWFFcGREekVRVDUrOFNzSVAxOWdWakVYa3NOMlVGT3plSFdkZTA0RlFOSXdYOFVhSlRZMlNlS2J4Vk1Sd0VVWWdZMjdIUDV1dHhxWlpMbUs5WUEwL01ZQlBQRU9LQ0dteUtXeGc1L0FlYysrWURvVnM3cnVWUGNUdG9KSWlpSlFnSmw1UHBVY2pqcHo0bThZMjQyUS0tMTlVZjhGWUIzQUVJL2FoSkJrSmFSUT09--bf63b393922bc4bab1dbcdb39889813432ff735f",
            "X-Csrf-Token":
              "Xow5D9fTtH53Wsr4n7VAEdMYOP1RSDn6tQKZ/Aq2BfvKNcH0V3KXvB/J/TNC8RaXQvwG44X4f/9wLEwUez7Xzg==",
            "X-Pco-Live-Socket-Id": uid,
            "X-Requested-With": "XMLHttpRequest",
          },
          method: "POST",
        }
      );
    },
    async getSongs() {
      const response = await fetch(
        "https://api.planningcenteronline.com/services/v2/service_types/227874/plans/" +
          this.planId +
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
