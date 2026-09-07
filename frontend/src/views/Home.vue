<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = computed(() => Utils.getStore("user"));

const signOut = async () => {
  try {
    await AuthServices.logoutUser();
  } catch {
    // Always clear the local session so the device cannot stay signed in.
  }

  Utils.removeItem("user");
  await router.push({ name: "login" });
};
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-4">Welcome, {{ user?.fName || "there" }}</h1>
    <v-btn color="secondary" variant="outlined" class="oc-cta" @click="signOut">Sign out</v-btn>
  </v-container>
</template>
