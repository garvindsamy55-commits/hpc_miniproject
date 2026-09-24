# Microsoft Azure Deployment & Cloud Configuration Guide

This guide details the step-by-step procedure to deploy **CloudBurst** with live **Azure Blob Storage** containers, **Azure RBAC / Managed Identity**, and an **Azure Functions** serverless processor.

---

## 1. Azure Blob Storage Account & Container Creation

Create a storage account and two dedicated blob containers in your target Azure region (e.g., `eastus`):

### Using Azure CLI
```bash
# 1. Create a Resource Group
az group create --name cloudburst-rg --location eastus

# 2. Create Storage Account (Standard LRS)
az storage account create \
  --name cloudburststorage \
  --resource-group cloudburst-rg \
  --location eastus \
  --sku Standard_LRS

# 3. Create Input Container (Raw file uploads)
az storage container create \
  --account-name cloudburststorage \
  --name cloudburst-input-container \
  --auth-mode login

# 4. Create Output Container (Processed results)
az storage container create \
  --account-name cloudburststorage \
  --name cloudburst-output-container \
  --auth-mode login
```

---

## 2. Azure RBAC / Service Principal Authentication (Least Privilege)

Create a Service Principal or assign Managed Identity with the **Storage Blob Data Contributor** role:

```bash
# Create Service Principal
az ad sp create-for-rbac \
  --name "cloudburst-sp" \
  --role "Storage Blob Data Contributor" \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/cloudburst-rg/providers/Microsoft.Storage/storageAccounts/cloudburststorage
```

---

## 3. Azure Function Blob-Trigger Deployment

Deploy the Azure Function located in `backend/app/azure/azure_function.py`:

```bash
# Create Function App
az functionapp create \
  --resource-group cloudburst-rg \
  --consumption-plan-location eastus \
  --runtime python \
  --runtime-version 3.11 \
  --functions-version 4 \
  --name cloudburst-processor-fn \
  --storage-account cloudburststorage \
  --os-type linux

# Publish Function code
cd backend/app/azure
func azure functionapp publish cloudburst-processor-fn
```

---

## 4. Backend Environment Configuration

Set the following variables in `backend/.env`:

```env
OPERATING_MODE=azure
AZURE_REGION=eastus
AZURE_STORAGE_ACCOUNT_NAME=cloudburststorage
AZURE_BLOB_INPUT_CONTAINER=cloudburst-input-container
AZURE_BLOB_OUTPUT_CONTAINER=cloudburst-output-container

# Option A: Connection String Auth
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=cloudburststorage;AccountKey=...;EndpointSuffix=core.windows.net"

# Option B: Service Principal / Managed Identity Auth
AZURE_CLIENT_ID=<CLIENT_ID>
AZURE_CLIENT_SECRET=<CLIENT_SECRET>
AZURE_TENANT_ID=<TENANT_ID>
```

---

## 5. Verifying Deployment

Start the backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Verify the live Azure connection:
```bash
curl http://localhost:8000/api/azure/status
```
