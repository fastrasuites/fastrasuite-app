import fs from 'fs';

async function testApi() {
  try {
    // 1. Login
    console.log("Logging in...");
    const loginRes = await fetch("https://www.fastrasuiteapi.com.ng/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "efemiayafavour@gmail.com", password: "Quasa12345." })
    });
    
    if (!loginRes.ok) {
      console.log("Login failed:", loginRes.status, await loginRes.text());
      return;
    }
    
    const loginData = await loginRes.json();
    console.log("Login successful. Tenant:", loginData.tenant_schema_name);
    
    const token = loginData.access_token;
    const tenant = loginData.tenant_schema_name;
    const domain = `https://${tenant}.fastrasuiteapi.com.ng`;
    
    // 2. Fetch Products
    console.log(`\nFetching inventory products from ${domain}/inventory/products/...`);
    const prodRes = await fetch(`${domain}/inventory/products/`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (!prodRes.ok) {
      console.log("Products failed:", prodRes.status, await prodRes.text());
    } else {
      const prodData = await prodRes.json();
      console.log("Products Data Structure:", JSON.stringify(prodData).substring(0, 500) + "...");
      console.log("Is Array?", Array.isArray(prodData));
      if (!Array.isArray(prodData)) {
        console.log("Keys:", Object.keys(prodData));
      }
    }

    // 3. Fetch POs
    console.log(`\nFetching POs from ${domain}/purchase/purchase-order/...`);
    const poRes = await fetch(`${domain}/purchase/purchase-order/`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (!poRes.ok) {
      console.log("POs failed:", poRes.status, await poRes.text());
    } else {
      const poData = await poRes.json();
      console.log("POs Data Structure:", JSON.stringify(poData).substring(0, 500) + "...");
      console.log("Is Array?", Array.isArray(poData));
      if (!Array.isArray(poData)) {
        console.log("Keys:", Object.keys(poData));
      }
    }

  } catch (err) {
    console.error(err);
  }
}

testApi();
