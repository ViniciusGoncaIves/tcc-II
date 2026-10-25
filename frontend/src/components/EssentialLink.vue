<template>
  <q-item clickable v-ripple :to="props.to" exact>
    <q-item-section v-if="props.icone" avatar>
      <q-icon :name="props.icone" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ props.titulo }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>
const props = defineProps({
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
