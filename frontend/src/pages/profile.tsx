import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, Building, Phone, MapPin } from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const profileFields = [
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Name', value: user.contactPersonName, icon: User },
    { label: 'Company', value: user.companyName || 'N/A', icon: Building },
    { label: 'Role', value: user.role?.replace('_', ' ').toUpperCase() || 'N/A', icon: User },
    { label: 'Phone', value: user.phoneNumber || 'N/A', icon: Phone },
    { label: 'Address', value: user.physicalAddress || 'N/A', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl">Profile</CardTitle>
                  <CardDescription>
                    Manage your account information
                  </CardDescription>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-orange-400 rounded-lg flex items-center justify-center">
                  <User className="text-white h-8 w-8" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {/* Email Verification Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-800">Email Verification</p>
                      <p className="text-sm text-blue-600 mt-1">
                        {user.emailVerified 
                          ? '✓ Your email has been verified' 
                          : '⚠ Please verify your email'}
                      </p>
                    </div>
                    {!user.emailVerified && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/resend-verification')}
                      >
                        Verify Email
                      </Button>
                    )}
                  </div>
                </div>

                {/* Subscription Status */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">Subscription Status</p>
                      <p className="text-sm text-green-600 mt-1 capitalize">
                        {user.subscriptionStatus || 'inactive'}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/subscription')}
                    >
                      Manage
                    </Button>
                  </div>
                </div>

                {/* 2FA Status */}
                <div className={`${user.twoFactorEnabled ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'} rounded-lg p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${user.twoFactorEnabled ? 'text-green-800' : 'text-amber-800'}`}>
                        Two-Factor Authentication
                      </p>
                      <p className={`text-sm ${user.twoFactorEnabled ? 'text-green-600' : 'text-amber-600'} mt-1`}>
                        {user.twoFactorEnabled 
                          ? '✓ 2FA is enabled' 
                          : '⚠ 2FA is not enabled'}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/account/security')}
                    >
                      Configure
                    </Button>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Account Information</h3>
                    <Button 
                      variant={isEditing ? "default" : "outline"}
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={isSaving}
                    >
                      {isEditing ? 'Done' : 'Edit'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileFields.map((field) => {
                      const Icon = field.icon;
                      return (
                        <div key={field.label}>
                          <Label className="flex items-center space-x-2 mb-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{field.label}</span>
                          </Label>
                          {isEditing ? (
                            <Input 
                              value={field.value} 
                              readOnly={field.label === 'Email' || field.label === 'Role'}
                              className="bg-muted"
                              disabled={field.label === 'Email' || field.label === 'Role'}
                            />
                          ) : (
                            <div className="p-3 bg-muted/50 rounded-md text-sm">
                              {field.value}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex justify-end space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        disabled={isSaving}
                        onClick={async () => {
                          setIsSaving(true);
                          // TODO: Implement profile update API call
                          setTimeout(() => {
                            setIsSaving(false);
                            setIsEditing(false);
                          }, 1000);
                        }}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
