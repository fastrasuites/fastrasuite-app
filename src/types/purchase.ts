// Local UI Product type (matches existing component interface)
export type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
};

// API Product type (from the actual API response)
export interface ApiProduct {
  url: string;
  id: number;
  product_name: string;
  product_description: string;
  product_category: string;
  available_product_quantity: string;
  total_quantity_purchased: string;
  unit_of_measure: number;
  created_on: string;
  updated_on: string;
  is_hidden: boolean;
  unit_of_measure_details: {
    url: string;
    unit_name: string;
    unit_symbol: string;
    unit_category: string;
    created_on: string;
    is_hidden: boolean;
  };
}

export type BreadcrumbItem = {
  label: string;
  href: string;
  current?: boolean;
};

export type ViewType = "grid" | "list";

// Local UI Vendor type (matches existing component interface)
export type Vendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  profile_picture?: string;
};

// API Vendor type (from the actual API response)
export interface ApiVendor {
  url: string;
  id: number;
  company_name: string;
  profile_picture: string;
  email: string;
  address: string;
  phone_number: string;
  is_hidden: boolean;
}
