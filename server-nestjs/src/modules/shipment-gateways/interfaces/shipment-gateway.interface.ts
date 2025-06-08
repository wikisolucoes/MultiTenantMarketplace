export interface ShippingRequest {
  from: {
    zipCode: string;
    address: string;
    city: string;
    state: string;
    country?: string;
  };
  to: {
    zipCode: string;
    address: string;
    city: string;
    state: string;
    country?: string;
  };
  package: {
    weight: number; // in kg
    height: number; // in cm
    width: number; // in cm
    length: number; // in cm
    value: number; // declared value
  };
  services?: string[]; // specific services to quote
  additionalServices?: {
    declaredValue?: boolean;
    receipt?: boolean;
    ownHand?: boolean;
    collectOnDelivery?: boolean;
  };
}

export interface ShippingQuote {
  service: string;
  serviceName: string;
  price: number;
  currency: string;
  estimatedDays: number;
  carrier: string;
  additionalInfo?: string;
  error?: string;
}

export interface ShippingResponse {
  success: boolean;
  quotes: ShippingQuote[];
  trackingCode?: string;
  error?: string;
}

export interface TrackingRequest {
  trackingCode: string;
  carrier?: string;
}

export interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
}

export interface TrackingResponse {
  success: boolean;
  trackingCode: string;
  status: string;
  carrier: string;
  events: TrackingEvent[];
  estimatedDelivery?: string;
  error?: string;
}

export interface LabelRequest {
  from: ShippingRequest['from'];
  to: ShippingRequest['to'];
  package: ShippingRequest['package'];
  service: string;
  declaredValue?: number;
  additionalServices?: ShippingRequest['additionalServices'];
}

export interface LabelResponse {
  success: boolean;
  labelUrl?: string;
  trackingCode?: string;
  price?: number;
  error?: string;
}

export abstract class ShipmentGateway {
  abstract calculateShipping(request: ShippingRequest): Promise<ShippingResponse>;
  abstract trackPackage(request: TrackingRequest): Promise<TrackingResponse>;
  abstract createLabel(request: LabelRequest): Promise<LabelResponse>;
  abstract getServices(): Promise<{ code: string; name: string; description?: string }[]>;
  abstract validateCredentials(): Promise<boolean>;
  abstract calculateFees(amount: number, service: string): number;
}