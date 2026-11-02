import { toolRegistry } from './registry';
import {
  searchCatalogTool,
  updateProductPriceTool,
  toggleProductStockTool,
} from './definitions/productTools';
import {
  updateOrderStatusTool,
  getOrderSummaryTool,
} from './definitions/orderTools';
import {
  updateZoneMinOrderTool,
  updateDormOverrideTool,
} from './definitions/zoneDormTools';
import { toggleStoreStatusTool } from './definitions/storeTools';
import {
  blacklistCustomerTool,
  unbanCustomerTool,
} from './definitions/blacklistTools';

// Register all system tools (Open/Closed Principle)
toolRegistry
  .register(searchCatalogTool)
  .register(updateProductPriceTool)
  .register(toggleProductStockTool)
  .register(updateOrderStatusTool)
  .register(getOrderSummaryTool)
  .register(updateZoneMinOrderTool)
  .register(updateDormOverrideTool)
  .register(toggleStoreStatusTool)
  .register(blacklistCustomerTool)
  .register(unbanCustomerTool);

export { toolRegistry };
