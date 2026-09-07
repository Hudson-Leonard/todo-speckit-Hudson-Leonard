<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const requiredTrim = (message) => (value) => !!value?.trim() || message;
const usernameRules = [requiredTrim("Username is required.")];
const passwordRules = [
  requiredTrim("Password is required."),
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmRules = [(value) => value === password.value || "Passwords do not match."];

const createAccount = async () => {
  errorMessage.value = "";
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const res = await AuthServices.registerUser({
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
      password: password.value,
    });
    Utils.setStore("user", res.data);
    await router.push({ name: "home" });
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to create account.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5 mb-4">Create account</v-card-title>
          <v-alert v-if="errorMessage" type="error" class="mb-4">{{ errorMessage }}</v-alert>
          <v-form ref="form" @submit.prevent="createAccount">
            <v-text-field v-model="fName" label="First name" :rules="[requiredTrim('First name is required.')]" class="mb-2" />
            <v-text-field v-model="lName" label="Last name" :rules="[requiredTrim('Last name is required.')]" class="mb-2" />
            <v-text-field v-model="email" label="Email" :rules="emailRules" autocomplete="email" class="mb-2" />
            <v-text-field v-model="username" label="Username" :rules="usernameRules" autocomplete="username" class="mb-2" />
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              :rules="passwordRules"
              autocomplete="new-password"
              class="mb-2"
            />
            <v-text-field
              v-model="confirmPassword"
              label="Confirm password"
              type="password"
              :rules="confirmRules"
              autocomplete="new-password"
              class="mb-4"
            />
            <v-btn type="submit" color="primary" variant="elevated" class="oc-cta" :loading="loading" block>
              Create account
            </v-btn>
          </v-form>
          <div class="mt-4 text-center">
            <router-link :to="{ name: 'login' }">Already have an account? Sign in</router-link>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
