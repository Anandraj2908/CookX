import { useState, useEffect } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { useToast } from "@/hooks/use-toast";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  BellRing, 
  Moon, 
  Save, 
  Settings as SettingsIcon, 
  Sun, 
  User,
  UtensilsCrossed
} from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [daysThreshold, setDaysThreshold] = useState(3);
  const [lowQuantityAlerts, setLowQuantityAlerts] = useState(true);
  const [mealReminders, setMealReminders] = useState(false);
  const [dietaryPreferences, setDietaryPreferences] = useState<string>("");
  const { toast } = useToast();
  
  // Load preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem("dietaryPreferences");
    if (savedPreferences) {
      setDietaryPreferences(savedPreferences);
    }
  }, []);
  
  // Save dietary preferences to localStorage
  const saveDietaryPreferences = () => {
    localStorage.setItem("dietaryPreferences", dietaryPreferences);
    toast({
      title: "Preferences Saved",
      description: "Your dietary preferences have been saved successfully."
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="dietary">Dietary</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure the application's appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="theme">Theme</Label>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <Select
                      value={theme}
                      onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <Moon className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Expiry Date Settings */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Expiry Date Warning Threshold</Label>
                  <span className="text-sm font-medium">{daysThreshold} days</span>
                </div>
                <Slider
                  value={[daysThreshold]}
                  min={1}
                  max={14}
                  step={1}
                  onValueChange={(value) => setDaysThreshold(value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Items expiring within this many days will be highlighted as expiring soon
                </p>
              </div>

              <div className="pt-4">
                <Button className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Dietary Preferences */}
        <TabsContent value="dietary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Dietary Preferences
              </CardTitle>
              <CardDescription>
                Set your dietary preferences for recipe recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dietary-preferences">
                  Your Dietary Preferences & Constraints
                </Label>
                <Textarea 
                  id="dietary-preferences"
                  placeholder="Enter your dietary preferences and constraints here. For example: vegetarian, gluten-free, low-carb, Indian cuisine, no seafood, etc."
                  className="min-h-32 resize-y"
                  value={dietaryPreferences}
                  onChange={(e) => setDietaryPreferences(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your preferences will be used to generate recipe recommendations that match your dietary needs and cuisine preferences.
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Example Preferences:</p>
                <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Dietary restrictions: vegetarian, vegan, gluten-free, dairy-free, nut-free, etc.</li>
                  <li>Cuisine preferences: Italian, Indian, Mexican, Chinese, etc.</li>
                  <li>Regional specialties: Bihari cuisine, Southern Italian, Northern Thai, etc.</li>
                  <li>Cooking style: quick meals, one-pot dishes, meal prep friendly, etc.</li>
                  <li>Health goals: low-carb, high-protein, low-sodium, etc.</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveDietaryPreferences} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="expiry-notifications">Expiry Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts about items expiring soon
                    </p>
                  </div>
                  <Switch
                    id="expiry-notifications"
                    checked={true}
                    disabled
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="low-quantity">Low Quantity Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts when inventory items are running low
                    </p>
                  </div>
                  <Switch
                    id="low-quantity"
                    checked={lowQuantityAlerts}
                    onCheckedChange={setLowQuantityAlerts}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="meal-reminders">Meal Plan Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders about upcoming planned meals
                    </p>
                  </div>
                  <Switch
                    id="meal-reminders"
                    checked={mealReminders}
                    onCheckedChange={setMealReminders}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="username" disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="example@email.com" />
              </div>
              
              <div className="pt-4 space-y-2">
                <Button className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Account Changes
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Account preferences are only stored locally in this demo.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}