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
        ><b-button variant="success" @click="addNameToSingersList">+</b-button>
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
    <b-button variant="info" @click="exportPDF" ref="exportButton">{{exportButtonText}}</b-button>
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
      exportButtonText: "Export to PDF",
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
    addNameToSingersList() {
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

      //creating the pdf as blob with jsPDF
      var pdf = doc.output("blob");
      //setting application type for the blob (maybe unnecessary)
      var blob = new Blob([pdf], { type: "application/pdf" });

      //creating formData since the pco-api wants to recieve the file as formData
      var formData = new FormData();

      var planDate = this.plans.find((plan) => plan.id == this.planId).attributes.dates;

      //filling the formdata with the blob and defining the name of the file
      formData.append("file", blob, "Erste Stimme - " + planDate + ".pdf");

      //first step is to upload the file as a unassigned attachment
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

      //then using the returnd uid to attach the file to the selected plan
      const attachmentRes = fetch(
        "https://api.planningcenteronline.com/services/v2/service_types/227874/plans/" +
          this.planId +
          "/attachments",
        {
          headers: {
            Authorization:
              "Basic MzRmMzY5OWNkMmFkZjc3YmFmOTNlMDJlZjUyYjU3YTYxYjI4MWIyNDcyZjRkZjQwM2E0NDE5ODI3NDM5ZmYyYjpmODBmYmVmNzA2Nzg2NjI4MDY3NTlhOTcyNTBhY2VjMTMxOTFhZGI5Y2Q5NzIxOGY1YjBmYTY0ZDUwYjBlOWVk",
          },
          body: JSON.stringify({
            type: "Attachment",
            data: {
              attributes: {
                file_upload_identifier: uid,
              },
            },
          }),
          method: "POST",
        }
      );
    const attachmentFeedback = await attachmentRes
    console.log(attachmentFeedback.status)
    if (attachmentFeedback.status >100 && attachmentFeedback.status <= 300) {
        this.exportButtonText = "Erfolgreich!"
    } else {
      this.exportButtonText = "Fehler: "+ attachmentFeedback.status
    }
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
    },
  },
};
</script>

<style>
</style>
