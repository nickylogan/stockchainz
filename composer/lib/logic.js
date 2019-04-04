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
  let name = trx.name;
  let description = trx.description;
  let seller = getCurrentParticipant();

  let id = uuidv4();
  let itemID = `ITEM_${id}`;
  let invID = `INV_${id}`;

  let item = getFactory().newResource(NS, 'Item', itemID);
  item.name = name;
  item.description = description;
  item.seller = seller;

  let inventory = getFactory().newResource(NS, 'Inventory', invID);
  inventory.item = item;
  inventory.changes = [];

  let itemRegistry = await getAssetRegistry(NS_ITEM);
  await itemRegistry.add(item);

  let invRegistry = await getAssetRegistry(NS_INV);
  await invRegistry.add(inventory);

  emitEvent(`Successfully added item ${itemID}`);
}

/**
 * Handles PlaceOrder transactions
 * @param {com.stockchainz.net.PlaceOrder} trx the order placement transaction
 * @transaction
 */
async function onPlaceOrder(trx) {
  let item = trx.item;
  let amount = trx.amount;
  let buyer = getCurrentParticipant();

  let id = uuidv4();
  let saleID = `SALE_${id}`;

  let sale = getFactory().newResource(NS, 'Sale', saleID);
  sale.item = item;
  sale.amount = amount;
  sale.buyer = buyer;

  let saleRegistry = await getAssetRegistry(NS_SALE);
  await saleRegistry.add(sale);

  emitEvent(`Successfully placed order ${saleID}`);
}

/**
 * Handles ConfirmSale transactions
 * @param {com.stockchainz.net.ConfirmSale} trx the ConfirmSale transaction
 * @transaction
 */
async function onConfirmSale(trx) {
  let sale = trx.sale;
  let item = sale.item;
  if (sale.amount > item.amount) {
    throw new Error('Not enough items in stock');
  }
  if (sale.status === 'CONFIRMED') {
    throw new Error('Sale already confirmed');
  }

  item.amount -= sale.amount;

  const invs = await query('queryInventory', { item: `resource:${item.getFullyQualifiedIdentifier()}` });
  let inv = invs[0];

  let delta = getFactory().newConcept(NS, 'InventoryDelta');
  delta.amount = -sale.amount;
  delta.type = 'SALE';
  inv.changes.push(delta);

  sale.status = 'CONFIRMED';

  let itemRegistry = await getAssetRegistry(NS_ITEM);
  await itemRegistry.update(item);

  let invRegistry = await getAssetRegistry(NS_INV);
  await invRegistry.update(inv);

  let saleRegistry = await getAssetRegistry(NS_SALE);
  await saleRegistry.update(sale);

  emitEvent(
    `${sale.amount} of item ${item.getIdentifier()} successfully sold to ` +
      `${sale.buyer.getIdentifier()}. ${item.amount} left in stock.`
  );
}

/**
 * Handles RestockItem transactions
 * @param {com.stockchainz.net.RestockItem} trx the restock transaction
 * @transaction
 */
async function onRestockItem(trx) {
  let item = trx.item;

  item.amount += trx.amount;

  const invs = await query('queryInventory', { item: `resource:${item.getFullyQualifiedIdentifier()}` });
  let inv = invs[0];

  let delta = getFactory().newConcept(NS, 'InventoryDelta');
  delta.amount = trx.amount;
  delta.type = 'RESTOCK';

  inv.changes.push(delta);

  let itemRegistry = await getAssetRegistry(NS_ITEM);
  await itemRegistry.update(item);

  let invRegistry = await getAssetRegistry(NS_INV);
  await invRegistry.update(inv);

  emitEvent(
    `Item ${item.getIdentifier()} successfully restocked with amount ${trx.amount}. ` +
      `Now ${item.amount} in stock.`
  );
}

/**
 * Handles DeleteItem transactions
 * @param {com.stockchainz.net.DeleteItem} trx the delete item transaction
 * @transaction
 */
async function onDeleteItem(trx) {
  let item = trx.item;

  const invs = await query('queryInventory', { item: `resource:${item.getFullyQualifiedIdentifier()}` });
  let inv = invs[0];

  let invRegistry = await getAssetRegistry(NS_INV);
  await invRegistry.remove(inv);

  let itemRegistry = await getAssetRegistry(NS_ITEM);
  await itemRegistry.remove(item);

  emitEvent('Item successfully deleted');
}

/**
 * Handles UpdateItem transactions
 * @param {com.stockchainz.net.UpdateItem} trx the update item transaction
 * @transaction
 */
async function onUpdateItemName(trx) {
  let item = trx.item;
  item.name = trx.newName;
  item.description = trx.newDescription;

  let itemRegistry = await getAssetRegistry(NS_ITEM);

  await itemRegistry.update(item);

  emitEvent('Update success');
}

/**
 * Emits an event containing the specified message
 * @param {String} msg the message to be broadcasted
 */
function emitEvent(msg) {
  var event = getFactory().newEvent(NS, 'TransactionEvent');
  event.message = msg;
  emit(event);
}

/**
 * Returns a unique ID
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}