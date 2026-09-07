<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const username = ref("");
const password = ref("");

const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [(value) => !!value?.trim() || "Password is required."];

const signIn = async () => {
  errorMessage.value = "";
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const res = await AuthServices.loginUser({
      username: username.value.trim(),
      password: password.value,
    });
    Utils.setStore("user", res.data);
    await router.push({ name: "home" });
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to sign in.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5 mb-4">Sign in</v-card-title>
          <v-alert v-if="errorMessage" type="error" class="mb-4">{{ errorMessage }}</v-alert>
          <v-form ref="form" @submit.prevent="signIn">
            <v-text-field
              v-model="username"
              label="Username"
              :rules="usernameRules"
              autocomplete="username"
              class="mb-2"
            />
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              :rules="passwordRules"
              autocomplete="current-password"
              class="mb-4"
            />
            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              class="oc-cta"
              :loading="loading"
              block
            >
              Sign in
            </v-btn>
          </v-form>
          <div class="mt-4 text-center">
            <router-link :to="{ name: 'register' }">Create an account</router-link>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
