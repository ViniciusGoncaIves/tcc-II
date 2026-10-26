<template>
  <q-item clickable v-ripple :to="LProps.to" exact>
    <q-item-section v-if="LProps.icone" avatar>
      <q-icon :name="LProps.icone" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ LProps.titulo }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>
const LProps = defineProps({
  titulo: {
    type: String,
    required: true
  },

  to: {
    type: [String, Object],
    required: true
  },

  icone: {
    type: String,
    default: ''
  }
});
</script>
