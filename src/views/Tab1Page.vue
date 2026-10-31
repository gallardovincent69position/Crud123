
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>My CRUD App</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <div class="welcome">
        <h2>Item Management</h2>
        <p>Manage your records using Firebase Firestore.</p>
      </div>

      <!-- ADD / UPDATE FORM -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            {{ editingId ? 'Edit Item' : 'Add New Item' }}
          </ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <ion-input
            v-model="form.name"
            label="Item Name"
            label-placement="stacked"
            fill="outline"
            placeholder="Enter item name"
          />

          <ion-textarea
            v-model="form.description"
            label="Description"
            label-placement="stacked"
            fill="outline"
            placeholder="Enter description"
            :auto-grow="true"
            class="input-spacing"
          />

          <ion-input
            v-model="form.quantity"
            label="Quantity"
            label-placement="stacked"
            fill="outline"
            type="number"
            min="0"
            class="input-spacing"
          />

          <ion-button
            expand="block"
            class="input-spacing"
            @click="saveItem"
            :disabled="saving"
          >
            {{ saving ? 'Saving...' : editingId ? 'Update Item' : 'Add Item' }}
          </ion-button>

          <ion-button
            v-if="editingId"
            expand="block"
            fill="outline"
            color="medium"
            @click="resetForm"
          >
            Cancel
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- ERROR MESSAGE -->
      <ion-text color="danger" v-if="errorMessage">
        <p>{{ errorMessage }}</p>
      </ion-text>

      <!-- ITEM LIST -->
      <div class="list-heading">
        <h2>My Items</h2>
        <ion-badge color="primary">{{ items.length }} Records</ion-badge>
      </div>

      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" />
        <p>Loading items...</p>
      </div>

      <div v-else-if="items.length === 0" class="empty-state">
        <ion-icon :icon="cubeOutline" size="large" />
        <h3>No Items Yet</h3>
        <p>Add your first item using the form above.</p>
      </div>

      <ion-card v-for="item in items" :key="item.id">
        <ion-card-content>
          <div class="item-header">
            <div>
              <h2>{{ item.name }}</h2>
              <p>{{ item.description || 'No description' }}</p>
            </div>

            <ion-badge color="success">
              Qty: {{ item.quantity }}
            </ion-badge>
          </div>

          <ion-grid class="ion-no-padding">
            <ion-row>
              <ion-col>
                <ion-button
                  expand="block"
                  fill="outline"
                  color="warning"
                  @click="editItem(item)"
                >
                  <ion-icon :icon="createOutline" slot="start" />
                  Edit
                </ion-button>
              </ion-col>

              <ion-col>
                <ion-button
                  expand="block"
                  fill="outline"
                  color="danger"
                  @click="deleteItem(item.id)"
                >
                  <ion-icon :icon="trashOutline" slot="start" />
                  Delete
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonTextarea,
  IonButton,
  IonText,
  IonBadge,
  IonIcon,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/vue';

import {
  cubeOutline,
  createOutline,
  trashOutline
} from 'ionicons/icons';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

import { db } from '../firebase';

// ITEM TYPE
interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
}

// FORM DATA
const form = reactive({
  name: '',
  description: '',
  quantity: '1'
});

// STATES
const items = ref<Item[]>([]);
const editingId = ref<string | null>(null);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');

let unsubscribe: (() => void) | undefined;

// READ - LOAD FIRESTORE RECORDS
onMounted(() => {
  const itemsRef = collection(db, 'items');

  unsubscribe = onSnapshot(
    itemsRef,
    (snapshot) => {
      items.value = snapshot.docs.map((document) => {
        const data = document.data();

        return {
          id: document.id,
          name: data.name ?? '',
          description: data.description ?? '',
          quantity: Number(data.quantity ?? 0)
        };
      });

      loading.value = false;
    },
    (error) => {
      console.error(error);
      errorMessage.value = 'Failed to load items. Check Firebase settings and rules.';
      loading.value = false;
    }
  );
});

// CLEANUP
onUnmounted(() => {
  unsubscribe?.();
});

// RESET FORM
function resetForm() {
  form.name = '';
  form.description = '';
  form.quantity = '1';
  editingId.value = null;
  errorMessage.value = '';
}

// CREATE AND UPDATE
async function saveItem() {
  errorMessage.value = '';

  const name = form.name.trim();
  const quantity = Number(form.quantity);

  if (!name) {
    errorMessage.value = 'Please enter an item name.';
    return;
  }

  if (
    form.quantity.trim() === '' ||
    !Number.isInteger(quantity) ||
    quantity < 0
  ) {
    errorMessage.value = 'Enter a valid whole-number quantity.';
    return;
  }

  saving.value = true;

  try {
    const itemData = {
      name,
      description: form.description.trim(),
      quantity,
      updatedAt: serverTimestamp()
    };

    if (editingId.value) {
      // UPDATE
      await updateDoc(
        doc(db, 'items', editingId.value),
        itemData
      );
    } else {
      // CREATE
      await addDoc(collection(db, 'items'), {
        ...itemData,
        createdAt: serverTimestamp()
      });
    }

    resetForm();

  } catch (error) {
    console.error(error);
    errorMessage.value = 'Failed to save item.';
  } finally {
    saving.value = false;
  }
}

// EDIT
function editItem(item: Item) {
  editingId.value = item.id;
  form.name = item.name;
  form.description = item.description;
  form.quantity = String(item.quantity);
  errorMessage.value = '';
}

// DELETE
async function deleteItem(id: string) {
  const confirmed = window.confirm(
    'Are you sure you want to delete this item?'
  );

  if (!confirmed) return;

  try {
    errorMessage.value = '';

    await deleteDoc(doc(db, 'items', id));

    if (editingId.value === id) {
      resetForm();
    }

  } catch (error) {
    console.error(error);
    errorMessage.value = 'Failed to delete item.';
  }
}
</script>

<style scoped>
.welcome {
  margin: 10px 5px 20px;
}

.welcome h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
}

.welcome p {
  color: var(--ion-color-medium);
  margin-top: 0;
}

.input-spacing {
  margin-top: 15px;
}

.list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 25px 5px 10px;
}

.list-heading h2 {
  font-size: 20px;
  font-weight: 700;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 15px;
}

.item-header h2 {
  font-size: 17px;
  font-weight: 700;
}
  
.item-header p {
  color: var(--ion-color-medium);
  white-space: normal;
}

.empty-state {
  text-align: center;
  padding: 35px 10px;
  color: var(--ion-color-medium);
}

.empty-state h3 {
  font-weight: 700;
}
</style>
