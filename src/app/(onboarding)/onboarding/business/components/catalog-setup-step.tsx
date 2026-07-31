import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil } from "lucide-react";
import { CreateBusinessInput } from "@/features/onboarding/schemas";
import { FormControl, FormField, FormItem } from "@/components/ui/form";

interface CatalogSetupStepProps {
  form: UseFormReturn<CreateBusinessInput>;
}

export function CatalogSetupStep({ form }: CatalogSetupStepProps) {
  const {
    fields: serviceFields,
    append: appendService,
    remove: removeService,
  } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
    control: form.control,
    name: "products",
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in-0 duration-300">
      <div className="space-y-1 text-center sm:text-left">
        <h3 className="text-lg font-semibold">Catalog Setup</h3>
        <p className="text-sm text-muted-foreground">
          We pre-filled some items for you. Add or remove them as needed. All
          prices are in Rupees.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-primary">Services</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendService({ name: "", price: 0 })}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Service
          </Button>
        </div>

        {serviceFields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center gap-3 bg-muted/50 p-3 rounded-md"
          >
            <FormField
              control={form.control}
              name={`services.${index}.name`}
              render={({ field }) => (
                <FormItem className="flex-1 space-y-0">
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Service Name" 
                      rightSection={<Pencil className="h-3.5 w-3.5" />} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`services.${index}.price`}
              render={({ field }) => (
                <FormItem className="w-24 space-y-0">
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        value={field.value ? field.value / 100 : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? parseFloat(val) * 100 : 0);
                        }}
                        className="pl-7"
                        placeholder="0"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeService(index)}
              className="text-destructive h-10 w-10 shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {serviceFields.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-2">
            No services added.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-primary">Products</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendProduct({ name: "", price: 0 })}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </div>

        {productFields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center gap-3 bg-muted/50 p-3 rounded-md"
          >
            <FormField
              control={form.control}
              name={`products.${index}.name`}
              render={({ field }) => (
                <FormItem className="flex-1 space-y-0">
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Product Name" 
                      rightSection={<Pencil className="h-3.5 w-3.5" />} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`products.${index}.price`}
              render={({ field }) => (
                <FormItem className="w-24 space-y-0">
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        value={field.value ? field.value / 100 : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? parseFloat(val) * 100 : 0);
                        }}
                        className="pl-7"
                        placeholder="0"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeProduct(index)}
              className="text-destructive h-10 w-10 shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {productFields.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-2">
            No products added.
          </p>
        )}
      </div>
    </div>
  );
}
