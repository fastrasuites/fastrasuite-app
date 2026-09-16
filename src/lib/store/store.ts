// store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import { authApi } from "../../api/authApi";
import { userApi } from "../../api/userApi";
import { productsApi } from "../../api/purchase/productsApi";
import { unitOfMeasureApi } from "../../api/purchase/unitOfMeasureApi";
import { vendorsApi } from "../../api/purchase/vendorsApi";
import { purchaseRequestApi } from "../../api/purchase/purchaseRequestApi";
import { purchaseOrderApi } from "../../api/purchase/purchaseOrderApi";
import { requestForQuotationApi } from "../../api/purchase/requestForQuotationApi";
import { companyApi } from "@/api/settings/companyApi";
import { usersApi } from "@/api/settings/usersApi";
import { tenantUserApi } from "@/api/settings/tenantUserApi";
import { permissionsTemplateApi } from "@/api/settings/permissionsTemplateApi";
import { auditTrailApi } from "@/api/settings/auditTrailApi";
import { subscriptionApi } from "@/api/settings/subscriptionApi";
import { currencyApi } from "../../api/purchase/currencyApi";
import { locationApi } from "../../api/inventory/locationApi";
import { multilocationApi } from "../../api/inventory/multilocationApi";
import { stockAdjustmentApi } from "../../api/inventory/stockAdjustmentApi";
import { scrapApi } from "../../api/inventory/scrapApi";
import { accountingSettingsApi } from "../../api/invoice/accountingSettingsApi";
import { chartOfAccountsApi } from "../../api/invoice/chartOfAccountsApi";
import { companyBankAccountsApi } from "../../api/invoice/companyBankAccountsApi";
import { invoiceCurrencyApi } from "../../api/invoice/invoiceCurrencyApi";
import { invoicesApi } from "../../api/invoice/invoicesApi";
import { invoicingPreferencesApi } from "../../api/invoice/invoicingPreferencesApi";
import { paymentsApi } from "../../api/invoice/paymentsApi";
import { paymentTermsApi } from "../../api/invoice/paymentTermsApi";
import { projectPurchaseOrdersApi } from "../../api/invoice/projectPurchaseOrdersApi";
import { requestAccountMappingsApi } from "../../api/invoice/requestAccountMappingsApi";
import { vendorsApi as invoiceVendorsApi } from "../../api/invoice/vendorsApi";
import { vendorBankAccountsApi } from "../../api/invoice/vendorBankAccountsApi";
import { vendorImportApi } from "../../api/invoice/vendorImportApi";

import authReducer from "./authSlice";
import viewModeReducer from "../../components/Settings/viewModeSlice";

import { stockLocationApi } from "@/api/inventory/stockLocationApi";
import { incomingProductApi } from "@/api/inventory/incomingProductApi";
import { deliveryOrderApi } from "@/api/inventory/deliveryOrderApi";
import { deliveryOrderReturnApi } from "@/api/inventory/deliveryOrderReturnApi";
import { internalTransferApi } from "@/api/inventory/internalTransferApi";
import { stockMoveApi } from "@/api/inventory/stockMoveApi";
import { incomingProductReturnsApi } from "@/api/inventory/incomingProductReturns";
import { backOrderApi } from "@/api/inventory/backOrderApi";
import { inventoryProductsApi } from "@/api/inventory/productsApi";
import { inventoryUnitOfMeasureApi } from "@/api/inventory/unitOfMeasureApi";
import { productCategoryApi } from "@/api/inventory/productCategoryApi";
import { stockOnHandApi } from "@/api/inventory/stockOnHandApi";

import { subcontractorRequestApi } from "@/api/subcontractorRequestApi";
import { projectApi } from "@/api/projectApi";
import { projectCostingApi } from "@/api/projectCostingApi";
import { labourRequestApi } from "@/api/requests/labourRequestApi";
import { projectPurchaseRequestApi } from "@/api/requests/projectPurchaseRequestApi";
import { plantEquipmentRequestApi } from "@/api/requests/plantEquipmentRequestApi";
import { projectRequestApi } from "@/api/requests/projectRequestApi";
import { pettyCashRequestApi } from "@/api/requests/pettyCashRequestApi";
import { materialConsumptionRequestApi } from "@/api/requests/materialConsumptionRequestApi";

import { approvedProjectRequestsApi } from "@/api/invoice/approvedProjectRequestsApi";
import { vendorBillsApi } from "@/api/invoice/vendorBillsApi";
import { notificationApi } from "@/api/notificationApi";
import { accountLedgerApi } from "@/api/invoice/accountLedgerApi";
import { disbursementsApi } from "@/api/invoice/disbursementApi";

const authPersistConfig = {
  key: "auth",
  storage,
};

const viewModePersistConfig = {
  key: "viewMode",
  storage,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const rootReducer = combineReducers({
  auth: persistedAuthReducer,

  viewMode: persistReducer(viewModePersistConfig, viewModeReducer),

  [notificationApi.reducerPath]: notificationApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [tenantUserApi.reducerPath]: tenantUserApi.reducer,
  [permissionsTemplateApi.reducerPath]: permissionsTemplateApi.reducer,
  [auditTrailApi.reducerPath]: auditTrailApi.reducer,

  [productsApi.reducerPath]: productsApi.reducer,
  [unitOfMeasureApi.reducerPath]: unitOfMeasureApi.reducer,
  [vendorsApi.reducerPath]: vendorsApi.reducer,
  [purchaseRequestApi.reducerPath]: purchaseRequestApi.reducer,
  [purchaseOrderApi.reducerPath]: purchaseOrderApi.reducer,
  [requestForQuotationApi.reducerPath]: requestForQuotationApi.reducer,

  [currencyApi.reducerPath]: currencyApi.reducer,

  [locationApi.reducerPath]: locationApi.reducer,
  [stockLocationApi.reducerPath]: stockLocationApi.reducer,
  [multilocationApi.reducerPath]: multilocationApi.reducer,
  [stockAdjustmentApi.reducerPath]: stockAdjustmentApi.reducer,
  [scrapApi.reducerPath]: scrapApi.reducer,
  [incomingProductApi.reducerPath]: incomingProductApi.reducer,
  [deliveryOrderApi.reducerPath]: deliveryOrderApi.reducer,
  [deliveryOrderReturnApi.reducerPath]: deliveryOrderReturnApi.reducer,
  [internalTransferApi.reducerPath]: internalTransferApi.reducer,
  [stockMoveApi.reducerPath]: stockMoveApi.reducer,
  [incomingProductReturnsApi.reducerPath]: incomingProductReturnsApi.reducer,
  [backOrderApi.reducerPath]: backOrderApi.reducer,
  [inventoryProductsApi.reducerPath]: inventoryProductsApi.reducer,
  [inventoryUnitOfMeasureApi.reducerPath]: inventoryUnitOfMeasureApi.reducer,
  [productCategoryApi.reducerPath]: productCategoryApi.reducer,
  [stockOnHandApi.reducerPath]: stockOnHandApi.reducer,

  [subcontractorRequestApi.reducerPath]: subcontractorRequestApi.reducer,

  [projectApi.reducerPath]: projectApi.reducer,
  [projectCostingApi.reducerPath]: projectCostingApi.reducer,

  [labourRequestApi.reducerPath]: labourRequestApi.reducer,
  [projectPurchaseRequestApi.reducerPath]: projectPurchaseRequestApi.reducer,
  [plantEquipmentRequestApi.reducerPath]: plantEquipmentRequestApi.reducer,
  [projectRequestApi.reducerPath]: projectRequestApi.reducer,
  [pettyCashRequestApi.reducerPath]: pettyCashRequestApi.reducer,
  [materialConsumptionRequestApi.reducerPath]:
    materialConsumptionRequestApi.reducer,
  [accountingSettingsApi.reducerPath]: accountingSettingsApi.reducer,
  [chartOfAccountsApi.reducerPath]: chartOfAccountsApi.reducer,
  [companyBankAccountsApi.reducerPath]: companyBankAccountsApi.reducer,
  [invoiceCurrencyApi.reducerPath]: invoiceCurrencyApi.reducer,
  [invoicesApi.reducerPath]: invoicesApi.reducer,
  [invoicingPreferencesApi.reducerPath]: invoicingPreferencesApi.reducer,
  [paymentsApi.reducerPath]: paymentsApi.reducer,
  [paymentTermsApi.reducerPath]: paymentTermsApi.reducer,
  [projectPurchaseOrdersApi.reducerPath]: projectPurchaseOrdersApi.reducer,
  [requestAccountMappingsApi.reducerPath]: requestAccountMappingsApi.reducer,
  [invoiceVendorsApi.reducerPath]: invoiceVendorsApi.reducer,
  [vendorBankAccountsApi.reducerPath]: vendorBankAccountsApi.reducer,
  [vendorImportApi.reducerPath]: vendorImportApi.reducer,
  [companyApi.reducerPath]: companyApi.reducer,

  [approvedProjectRequestsApi.reducerPath]: approvedProjectRequestsApi.reducer,
  [vendorBillsApi.reducerPath]: vendorBillsApi.reducer,
  [accountLedgerApi.reducerPath]: accountLedgerApi.reducer,
  [disbursementsApi.reducerPath]: disbursementsApi.reducer,
  [subscriptionApi.reducerPath]: subscriptionApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      userApi.middleware,
      usersApi.middleware,
      tenantUserApi.middleware,
      permissionsTemplateApi.middleware,

      productsApi.middleware,
      unitOfMeasureApi.middleware,
      vendorsApi.middleware,
      purchaseRequestApi.middleware,
      purchaseOrderApi.middleware,
      requestForQuotationApi.middleware,

      currencyApi.middleware,

      locationApi.middleware,
      stockLocationApi.middleware,
      multilocationApi.middleware,
      stockAdjustmentApi.middleware,
      scrapApi.middleware,
      incomingProductApi.middleware,
      deliveryOrderApi.middleware,
      deliveryOrderReturnApi.middleware,
      internalTransferApi.middleware,
      stockMoveApi.middleware,
      incomingProductReturnsApi.middleware,
      backOrderApi.middleware,
      inventoryProductsApi.middleware,
      inventoryUnitOfMeasureApi.middleware,
      productCategoryApi.middleware,
      stockOnHandApi.middleware,

      subcontractorRequestApi.middleware,
      projectApi.middleware,
      projectCostingApi.middleware,
      labourRequestApi.middleware,
      projectPurchaseRequestApi.middleware,
      plantEquipmentRequestApi.middleware,
      projectRequestApi.middleware,
      pettyCashRequestApi.middleware,
      materialConsumptionRequestApi.middleware,

      accountingSettingsApi.middleware,
      chartOfAccountsApi.middleware,
      companyBankAccountsApi.middleware,
      invoiceCurrencyApi.middleware,
      invoicesApi.middleware,
      invoicingPreferencesApi.middleware,
      paymentsApi.middleware,
      paymentTermsApi.middleware,
      projectPurchaseOrdersApi.middleware,
      requestAccountMappingsApi.middleware,
      invoiceVendorsApi.middleware,
      vendorBankAccountsApi.middleware,
      vendorImportApi.middleware,
      companyApi.middleware,

      approvedProjectRequestsApi.middleware,
      vendorBillsApi.middleware,
      notificationApi.middleware,
      auditTrailApi.middleware,
      accountLedgerApi.middleware,
      disbursementsApi.middleware,
      subscriptionApi.middleware,
    ),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
