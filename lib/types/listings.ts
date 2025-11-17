export type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type Listing = {
  address: Address;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  availability: boolean;
  status: string;
};

export type ListingsResponse = {
  listings: Listing[];
};

