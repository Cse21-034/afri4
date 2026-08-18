import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/file-upload";
import { Truck, ShipIcon } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const optionalEmail = z.string().email("Invalid email address").optional().or(z.literal(''));

const truckingSchema = z.object({
  email: optionalEmail,
  password: passwordSchema,
  contactPersonName: z.string().min(1, "Contact person name is required"),
  companyName: z.string().min(1, "Company name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  physicalAddress: z.string().min(1, "Physical address is required"),
  businessRegistrationNumber: z.string().min(1, "Business registration number is required"),
  fleetSize: z.number().min(1, "Fleet size must be at least 1"),
  cargoTypes: z.array(z.string()).min(1, "Select at least one cargo type"),
  country: z.string().default("BWA"),
});

const shippingSchema = z.object({
  email: optionalEmail,
  password: passwordSchema,
  contactPersonName: z.string().min(1, "Contact person name is required"),
  companyName: z.string().min(1, "Company/Individual name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  physicalAddress: z.string().min(1, "Physical address is required"),
  businessRegistrationNumber: z.string().optional(),
  country: z.string().default("BWA"),
});

type TruckingFormData = z.infer<typeof truckingSchema>;
type ShippingFormData = z.infer<typeof shippingSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { register, isRegisterLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState("trucking");
  
  // Update active tab based on URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    if (typeParam === "shipping") {
      setActiveTab("shipping");
    } else if (typeParam === "trucking") {
      setActiveTab("trucking");
    }
  }, []);
  
  const truckingForm = useForm<TruckingFormData>({
    resolver: zodResolver(truckingSchema),
    defaultValues: {
      country: "BWA",
      cargoTypes: [],
    },
  });

  const shippingForm = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      country: "BWA",
    },
  });

  const [selectedCargoTypes, setSelectedCargoTypes] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [truckingFiles, setTruckingFiles] = useState<File[]>([]);

  const cargoTypeOptions = [
    { value: "general", label: "General Cargo" },
    { value: "refrigerated", label: "Refrigerated Goods" },
    { value: "hazardous", label: "Hazardous Materials" },
    { value: "bulk", label: "Bulk Cargo" },
    { value: "containers", label: "Containers (20ft/40ft)" },
    { value: "livestock", label: "Livestock" },
    { value: "agricultural", label: "Agricultural Products" },
    { value: "mining", label: "Mining Equipment & Minerals" },
    { value: "construction", label: "Construction Materials" },
    { value: "vehicles", label: "Vehicles & Machinery" },
    { value: "electronics", label: "Electronics" },
    { value: "textiles", label: "Textiles & Clothing" },
    { value: "pharmaceuticals", label: "Pharmaceuticals" },
    { value: "perishables", label: "Perishable Goods" },
    { value: "oversized", label: "Oversized/Heavy Machinery" },
    { value: "liquids", label: "Liquids/Tanker" },
  ];

  const countries = [
    { value: "AGO", label: "Angola" },
    { value: "BWA", label: "Botswana" },
    { value: "COD", label: "Democratic Republic of Congo" },
    { value: "SWZ", label: "Eswatini" },
    { value: "LSO", label: "Lesotho" },
    { value: "MWI", label: "Malawi" },
    { value: "MOZ", label: "Mozambique" },
    { value: "NAM", label: "Namibia" },
    { value: "ZAF", label: "South Africa" },
    { value: "TZA", label: "Tanzania" },
    { value: "ZMB", label: "Zambia" },
    { value: "ZWE", label: "Zimbabwe" },
  ];

  const handleCargoTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked 
      ? [...selectedCargoTypes, type]
      : selectedCargoTypes.filter(t => t !== type);
    setSelectedCargoTypes(newTypes);
    truckingForm.setValue("cargoTypes", newTypes);
  };

  const onTruckingSubmit = async (data: TruckingFormData) => {
    if (!agreedToTerms) {
      truckingForm.setError("root", { message: "You must agree to the Terms and Conditions" });
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "cargoTypes" && Array.isArray(value)) {
          value.forEach((v) => formData.append("cargoTypes", v));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      truckingFiles.forEach((file) => formData.append("documents", file));

      await register({ type: "trucking", userData: formData });
      navigate("/check-your-email");
    } catch (error) {
      // Error handled by useAuth hook
    }
  };

  const onShippingSubmit = async (data: ShippingFormData) => {
    if (!agreedToTerms) {
      shippingForm.setError("root", { message: "You must agree to the Terms and Conditions" });
      return;
    }

    try {
      await register({ type: "shipping", userData: data });
      navigate("/check-your-email");
    } catch (error) {
      // Error handled by useAuth hook
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="register-page">
      <Navbar />
      
      <div className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="register-title">
              Get Started Today
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your account type and join thousands of users already connecting freight across Africa
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8" data-testid="registration-tabs">
                  <TabsTrigger value="trucking" className="flex items-center gap-2" data-testid="trucking-tab">
                    <Truck className="h-4 w-4" />
                    Trucking Company
                  </TabsTrigger>
                  <TabsTrigger value="shipping" className="flex items-center gap-2" data-testid="shipping-tab">
                    <ShipIcon className="h-4 w-4" />
                    Shipping Entity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trucking" data-testid="trucking-form">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Register as Trucking Company</h3>
                    <p className="text-muted-foreground">BWP 500/month after 7-day free trial</p>
                  </div>
                  
                  <form onSubmit={truckingForm.handleSubmit(onTruckingSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input
                          id="company-name"
                          {...truckingForm.register("companyName")}
                          data-testid="input-company-name"
                        />
                        {truckingForm.formState.errors.companyName && (
                          <p className="text-destructive text-sm mt-1">
                            {truckingForm.formState.errors.companyName.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="contact-person">Contact Person</Label>
                        <Input
                          id="contact-person"
                          {...truckingForm.register("contactPersonName")}
                          data-testid="input-contact-person"
                        />
                        {truckingForm.formState.errors.contactPersonName && (
                          <p className="text-destructive text-sm mt-1">
                            {truckingForm.formState.errors.contactPersonName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          {...truckingForm.register("email")}
                          placeholder="No email? Leave this blank"
                          data-testid="input-email"
                        />
                        {truckingForm.formState.errors.email && (
                          <p className="text-destructive text-sm mt-1">
                            {truckingForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          {...truckingForm.register("phoneNumber")}
                          placeholder="+267 xxx xxxx"
                          data-testid="input-phone"
                        />
                        <p className="text-xs text-muted-foreground mt-1">We'll use this to reach you and for logging in.</p>
                        {truckingForm.formState.errors.phoneNumber && (
                          <p className="text-destructive text-sm mt-1">
                            {truckingForm.formState.errors.phoneNumber.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          {...truckingForm.register("password")}
                          data-testid="input-password"
                        />
                        {truckingForm.formState.errors.password && (
                          <p className="text-destructive text-sm mt-1">
                            {truckingForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="business-reg">Business Registration Number</Label>
                        <Input
                          id="business-reg"
                          {...truckingForm.register("businessRegistrationNumber")}
                          data-testid="input-business-reg"
                        />
                        {truckingForm.formState.errors.businessRegistrationNumber && (
                          <p className="text-destructive text-sm mt-1">
                            {truckingForm.formState.errors.businessRegistrationNumber.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="fleet-size">Fleet Size</Label>
                        <Input
                          id="fleet-size"
                          type="number"
                          min="1"
                          {...truckingForm.register("fleetSize", { valueAsNumber: true })}
                          data-testid="input-fleet-size"
                        />
                        {truckingForm.formState.errors.fleetSize && (
                          <p className="text-destructive text-sm mt-1">
                            {truckingForm.formState.errors.fleetSize.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select onValueChange={(value) => truckingForm.setValue("country", value)} defaultValue="BWA">
                          <SelectTrigger data-testid="select-country">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Physical Address</Label>
                      <Textarea
                        id="address"
                        {...truckingForm.register("physicalAddress")}
                        placeholder="Street address, city, postal code"
                        data-testid="textarea-address"
                      />
                      {truckingForm.formState.errors.physicalAddress && (
                        <p className="text-destructive text-sm mt-1">
                          {truckingForm.formState.errors.physicalAddress.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-3 block">Cargo Types</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="cargo-types">
                        {cargoTypeOptions.map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cargo-${type.value}`}
                              checked={selectedCargoTypes.includes(type.value)}
                              onCheckedChange={(checked) => handleCargoTypeChange(type.value, !!checked)}
                              data-testid={`checkbox-${type.value}`}
                            />
                            <Label htmlFor={`cargo-${type.value}`} className="text-sm font-normal">
                              {type.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {truckingForm.formState.errors.cargoTypes && (
                        <p className="text-destructive text-sm mt-1">
                          {truckingForm.formState.errors.cargoTypes.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-2 block">Business License Upload</Label>
                      <FileUpload
                        onFileUpload={(files) => setTruckingFiles((prev) => [...prev, ...files])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple={true}
                        data-testid="file-upload-license"
                      />
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms-trucking"
                        checked={agreedToTerms}
                        onCheckedChange={setAgreedToTerms}
                        data-testid="checkbox-terms"
                      />
                      <Label htmlFor="terms-trucking" className="text-sm leading-5">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                          Terms and Conditions
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    {truckingForm.formState.errors.root && (
                      <p className="text-destructive text-sm">
                        {truckingForm.formState.errors.root.message}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={isRegisterLoading}
                      data-testid="button-create-trucking-account"
                    >
                      {isRegisterLoading ? "Creating Account..." : "Create Trucking Company Account"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="shipping" data-testid="shipping-form">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Register as Shipping Entity</h3>
                    <p className="text-muted-foreground">Free to post and manage jobs</p>
                  </div>
                  
                  <form onSubmit={shippingForm.handleSubmit(onShippingSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="company-name-shipping">Company/Individual Name</Label>
                        <Input
                          id="company-name-shipping"
                          {...shippingForm.register("companyName")}
                          data-testid="input-company-name-shipping"
                        />
                        {shippingForm.formState.errors.companyName && (
                          <p className="text-destructive text-sm mt-1">
                            {shippingForm.formState.errors.companyName.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="contact-person-shipping">Contact Person</Label>
                        <Input
                          id="contact-person-shipping"
                          {...shippingForm.register("contactPersonName")}
                          data-testid="input-contact-person-shipping"
                        />
                        {shippingForm.formState.errors.contactPersonName && (
                          <p className="text-destructive text-sm mt-1">
                            {shippingForm.formState.errors.contactPersonName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email-shipping">Email Address (Optional)</Label>
                        <Input
                          id="email-shipping"
                          type="email"
                          {...shippingForm.register("email")}
                          placeholder="No email? Leave this blank"
                          data-testid="input-email-shipping"
                        />
                        {shippingForm.formState.errors.email && (
                          <p className="text-destructive text-sm mt-1">
                            {shippingForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone-shipping">Phone Number</Label>
                        <Input
                          id="phone-shipping"
                          {...shippingForm.register("phoneNumber")}
                          placeholder="+267 xxx xxxx"
                          data-testid="input-phone-shipping"
                        />
                        <p className="text-xs text-muted-foreground mt-1">We'll use this to reach you and for logging in.</p>
                        {shippingForm.formState.errors.phoneNumber && (
                          <p className="text-destructive text-sm mt-1">
                            {shippingForm.formState.errors.phoneNumber.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="password-shipping">Password</Label>
                        <Input
                          id="password-shipping"
                          type="password"
                          {...shippingForm.register("password")}
                          data-testid="input-password-shipping"
                        />
                        {shippingForm.formState.errors.password && (
                          <p className="text-destructive text-sm mt-1">
                            {shippingForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="country-shipping">Country</Label>
                        <Select onValueChange={(value) => shippingForm.setValue("country", value)} defaultValue="BWA">
                          <SelectTrigger data-testid="select-country-shipping">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="business-reg-shipping">Business Registration Number (Optional)</Label>
                        <Input
                          id="business-reg-shipping"
                          {...shippingForm.register("businessRegistrationNumber")}
                          placeholder="Registration number if applicable"
                          data-testid="input-business-reg-shipping"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address-shipping">Physical Address</Label>
                      <Textarea
                        id="address-shipping"
                        {...shippingForm.register("physicalAddress")}
                        placeholder="Street address, city, postal code, country"
                        data-testid="textarea-address-shipping"
                      />
                      {shippingForm.formState.errors.physicalAddress && (
                        <p className="text-destructive text-sm mt-1">
                          {shippingForm.formState.errors.physicalAddress.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms-shipping"
                        checked={agreedToTerms}
                        onCheckedChange={setAgreedToTerms}
                        data-testid="checkbox-terms-shipping"
                      />
                      <Label htmlFor="terms-shipping" className="text-sm leading-5">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                          Terms and Conditions
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    {shippingForm.formState.errors.root && (
                      <p className="text-destructive text-sm">
                        {shippingForm.formState.errors.root.message}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      disabled={isRegisterLoading}
                      data-testid="button-create-shipping-account"
                    >
                      {isRegisterLoading ? "Creating Account..." : "Create Shipping Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="text-center mt-6">
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium" data-testid="login-link">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
