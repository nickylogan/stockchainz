/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const NS = 'com.stockchainz.net';
const NS_ITEM = 'com.stockchainz.net.Item';
const NS_INV = 'com.stockchainz.net.Inventory';
const NS_SALE = 'com.stockchainz.net.Sale';

/**
 * Handles CreateItem transactions
 * @param {com.stockchainz.net.CreateItem} trx the create item transaction
 * @transaction
 */
async function onCreateItem(trx) {
  const itemID = trx.itemID;
  const name = trx.name;
  const description = trx.description;
  const seller = getCurrentParticipant();

  if (itemID === '') {
    throw new Error('Item ID cannot be empty');
  }

  if (name === '') {
    throw new Error('Item name cannot be empty');
  }

  const invID = `INV_${itemID}`;

  const item = getFactory().newResource(NS, 'Item', itemID);
  item.name = name;
  item.description = description;
  item.seller = seller;

  const inventory = getFactory().newResource(NS, 'Inventory', invID);
  inventory.item = item;
  inventory.changes = [];

  const itemRegistry = await getAssetRegistry(NS_ITEM);
  await itemRegistry.add(item);

  const invRegistry = await getAssetRegistry(NS_INV);
  await invRegistry.add(inventory);

  const event = getFactory().newEvent(NS, 'ItemCreated');
  event.itemID = itemID;
  emit(event);
}

/**
 * Handles PlaceOrder transactions
 * @param {com.stockchainz.net.PlaceOrder} trx the order placement transaction
 * @transaction
 */
async function onPlaceOrder(trx) {
  const item = trx.item;
  const amount = trx.amount;
  const buyer = getCurrentParticipant();

  if (amount > item.amount) {
    throw new Error('Not enough items in stock');
  }

  const id = trx.transactionId;
  const saleID = `S_${id}`;

  const sale = getFactory().newResource(NS, 'Sale', saleID);
  sale.item = item;
  sale.amount = amount;
  sale.buyer = buyer;

  const saleRegistry = await getAssetRegistry(NS_SALE);
  await saleRegistry.add(sale);

  const event = getFactory().newEvent(NS, 'OrderPlaced');
  event.saleID = saleID;
  emit(event);
}

/**
 * Handles ConfirmSale transactions
 * @param {com.stockchainz.net.ConfirmSale} trx the ConfirmSale transaction
 * @transaction
 */
async function onConfirmSale(trx) {
  const sale = trx.sale;
  const item = sale.item;

  if (sale.amount > item.amount) {
    throw new Error('Not enough items in stock');
  }
  if (sale.status === 'CONFIRMED') {
    throw new Error('Sale already confirmed');
  }

  item.amount -= sale.amount;

  const invs = await query('queryInventory', { item: `resource:${item.getFullyQualifiedIdentifier()}` });
  const inv = invs[0];

  const delta = getFactory().newConcept(NS, 'InventoryDelta');
  delta.amount = -sale.amount;
  delta.type = 'SALE';
  inv.changes.push(delta);

  sale.status = 'CONFIRMED';

  const itemRegistry = await getAssetRegistry(NS_ITEM);
  await itemRegistry.update(item);

  const invRegistry = await getAssetRegistry(NS_INV);
  await invRegistry.update(inv);

  const saleRegistry = await getAssetRegistry(NS_SALE);
  await saleRegistry.update(sale);

  const event1 = getFactory().newEvent(NS, 'SaleConfirmed');
  event1.saleID = sale.saleID;
  emit(event1);

  const event2 = getFactory().newEvent(NS, 'StockChanged');
  event2.itemID = item.itemID;
  event2.oldAmount = item.amount + sale.amount;
  event2.newAmount = item.amount;
  emit(event2);
}

/**
 * Handles RestockItem transactions
 * @param {com.stockchainz.net.RestockItem} trx the restock transaction
 * @transaction
 */
async function onRestockItem(trx) {
  const item = trx.item;

  item.amount += trx.amount;

  const invs = await query('queryInventory', { item: `resource:${item.getFullyQualifiedIdentifier()}` });
  const inv = invs[0];

  const delta = getFactory().newConcept(NS, 'InventoryDelta');
  delta.amount = trx.amount;
  delta.type = 'RESTOCK';

  inv.changes.push(delta);

  const itemRegistry = await getAssetRegistry(NS_ITEM);
  await itemRegistry.update(item);

  const invRegistry = await getAssetRegistry(NS_INV);
  await invRegistry.update(inv);

  const event = getFactory().newEvent(NS, 'StockChanged');
  event.itemID = item.itemID;
  event.oldAmount = item.amount - trx.amount;
  event.newAmount = item.amount;
  emit(event);
}

/**
 * Handles DeleteItem transactions
 * @param {com.stockchainz.net.DeleteItem} trx the delete item transaction
 * @transaction
 */
async function onDeleteItem(trx) {
  const item = trx.item;

  const itemRegistry = await getAssetRegistry(NS_ITEM);
  await itemRegistry.remove(item);

  const event = getFactory().newEvent(NS, 'ItemDeleted');
  event.itemID = item.itemID;
  emit(event);
}

/**
 * Handles UpdateItem transactions
 * @param {com.stockchainz.net.UpdateItem} trx the update item transaction
 * @transaction
 */
async function onUpdateItem(trx) {
  const item = trx.item;
  const oldDesc = item.description;
  // item.name = trx.newName;
  item.description = trx.newDescription;

  const itemRegistry = await getAssetRegistry(NS_ITEM);

  await itemRegistry.update(item);

  const event = getFactory().newEvent(NS, 'ItemModified');
  event.itemID = item.itemID;
  event.oldDescription = oldDesc;
  event.newDescription = item.description;
  emit(event);
}

