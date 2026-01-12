import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';
import { Plus, Trash2, ArrowLeft, Pencil, X, Save } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/utils/api';
import { validatePhoneNumber } from '@/services/auth/validation';
import PhoneInput from '@/components/PhoneInput';
import { DEFAULT_COUNTRY, Country } from '@/constants/countries';
import { useAuth } from '@/contexts/AuthContext';
import CustomAlertModal from '@/components/CustomAlertModal';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  country: Country;
  isExisting?: boolean;
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  buttonText?: string;
  onClose: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
}

export default function EmergencyContacts() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempContact, setTempContact] = useState<Contact | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Alert State
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onClose: () => {},
  });

  const showAlert = (config: Omit<AlertState, 'visible'>) => {
    setAlert({ ...config, visible: true });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/contacts/emergency', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.contacts && data.contacts.length > 0) {
          const mappedContacts = data.contacts.map((c: { id: string; name: string; phoneNumber?: string; phone_number?: string }) => ({
             id: c.id || String(Date.now() + Math.random()),
             name: c.name || '',
             phoneNumber: c.phoneNumber || c.phone_number || '', 
             country: DEFAULT_COUNTRY,
             isExisting: true,
          }));
          setContacts(mappedContacts);
        } else {
          setContacts([]);
        }
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const startEditing = (contact: Contact) => {
    if (editingId && editingId !== contact.id) {
      showAlert({
        title: 'Discard Changes?',
        message: 'You have unsaved changes. Discard them?',
        type: 'warning',
        buttonText: 'Discard',
        onClose: () => {
          hideAlert();
          setEditingId(contact.id);
          setTempContact({ ...contact });
          setErrors({});
        },
        secondaryButtonText: 'Cancel',
        onSecondaryPress: hideAlert,
      });
      return;
    }
    setEditingId(contact.id);
    setTempContact({ ...contact });
    setErrors({});
  };

  const cancelEditing = () => {
    if (!editingId) return;
    
    // If it was a new contact (empty name/phone) and we cancel, remove it
    const contact = contacts.find(c => c.id === editingId);
    if (contact && !contact.isExisting && !contact.name && !contact.phoneNumber) {
      setContacts(contacts.filter(c => c.id !== editingId));
    }

    setEditingId(null);
    setTempContact(null);
    setErrors({});
  };

  const updateTempContact = (field: 'name' | 'phoneNumber', value: string) => {
    if (tempContact) {
      setTempContact({ ...tempContact, [field]: value });
      if (errors[field]) {
        const newErrors = { ...errors };
        delete newErrors[field];
        setErrors(newErrors);
      }
    }
  };

  const updateTempCountry = (country: Country) => {
    if (tempContact) {
      setTempContact({ ...tempContact, country });
    }
  };

  // Helper to validate phone with fallback for leading zero
  const checkPhoneValidity = (phone: string, countryCode: string) => {
    let validation = validatePhoneNumber(phone, countryCode);
    if (!validation.valid && phone.startsWith('0')) {
      // Try removing leading zero
      validation = validatePhoneNumber(phone.substring(1), countryCode);
    }
    return validation;
  };

  // Check if form is valid and dirty
  const canSave = useMemo(() => {
    if (!tempContact || !editingId) return false;

    const originalContact = contacts.find(c => c.id === editingId);
    if (!originalContact) return false;

    const name = (tempContact.name || '').trim();
    const phone = (tempContact.phoneNumber || '').trim();

    // Required fields
    if (!name || !phone) return false;

    // Phone validation
    const validation = checkPhoneValidity(phone, tempContact.country.code);
    if (!validation.valid) return false;

    // Dirty check (has changes)
    const isDirty = 
      name !== originalContact.name || 
      phone !== originalContact.phoneNumber ||
      tempContact.country.code !== originalContact.country.code;

    return isDirty;
  }, [tempContact, editingId, contacts]);

  const saveContact = async () => {
    if (!tempContact || !canSave) return;

    const newErrors: Record<string, string> = {};
    const name = (tempContact.name || '').trim();
    const phone = (tempContact.phoneNumber || '').trim();

    if (!name) newErrors.name = 'Name required';
    if (!phone) newErrors.phone = 'Phone required';

    if (phone) {
      const validation = checkPhoneValidity(phone, tempContact.country.code);
      if (!validation.valid) {
        newErrors.phone = validation.error || 'Invalid format';
      } else {
        tempContact.phoneNumber = validation.formatted!;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      // Optimistically update
      const updatedContacts = contacts.map(c => c.id === tempContact.id ? { ...tempContact, isExisting: true } : c);
      
      // Send FULL list to backend
      const response = await apiFetch('/api/contacts/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contacts: updatedContacts.map((c) => ({
            name: c.name,
            phoneNumber: c.phoneNumber,
          })),
        }),
      });

      if (response.ok) {
        setContacts(updatedContacts);
        setEditingId(null);
        setTempContact(null);
      } else {
        const data = await response.json();
        showAlert({
          title: 'Error',
          message: data.error || 'Failed to save contact',
          type: 'error',
          onClose: hideAlert,
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      showAlert({
        title: 'Error',
        message: 'Network error. Please try again.',
        type: 'error',
        onClose: hideAlert,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addContact = () => {
    if (editingId) {
      showAlert({
        title: 'Unsaved Changes',
        message: 'Please save or cancel your current edit first.',
        type: 'warning',
        onClose: hideAlert,
      });
      return;
    }
    const newId = String(Date.now());
    const newContact: Contact = { 
      id: newId, 
      name: '', 
      phoneNumber: '', 
      country: DEFAULT_COUNTRY,
      isExisting: false 
    };
    setContacts([...contacts, newContact]);
    setEditingId(newId);
    setTempContact(newContact);
  };

  const removeContact = (id: string) => {
    const isLastContact = contacts.filter(c => c.isExisting).length === 1;
    
    showAlert({
      title: isLastContact ? 'Critical Warning' : 'Remove Contact',
      message: isLastContact 
        ? 'Deleting your only emergency contact will disable the Panic Button feature. Are you sure you want to proceed?'
        : 'Are you sure you want to remove this emergency contact?',
      type: 'error',
      buttonText: 'Remove',
      onClose: async () => {
        hideAlert();
        const updatedContacts = contacts.filter((c) => c.id !== id);
        setContacts(updatedContacts);
        
        try {
          await apiFetch('/api/contacts/emergency', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              contacts: updatedContacts.map((c) => ({
                name: c.name,
                phoneNumber: c.phoneNumber,
              })),
            }),
          });
        } catch (err) {
          console.error('Delete sync error:', err);
          showAlert({
            title: 'Warning',
            message: 'Failed to sync deletion with server.',
            type: 'warning',
            onClose: hideAlert,
          });
        }
      },
      secondaryButtonText: 'Cancel',
      onSecondaryPress: hideAlert,
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-neutral-500 mt-4">Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View 
        className="px-4 pb-3 border-b border-neutral-200 bg-white shadow-sm z-10"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center py-2"
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={24} color="#171717" />
            <Text className="text-lg font-semibold text-neutral-900 ml-2">
              Emergency Contacts
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Info Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6"
        >
          <Text className="text-primary-800 text-sm leading-5">
            These contacts will be notified in case of emergency when you trigger an alert.
          </Text>
        </Animated.View>

        {/* Contact List */}
        {contacts.map((contact, index) => {
          const isEditing = editingId === contact.id;
          
          return (
            <Animated.View
              key={contact.id}
              entering={FadeInDown.delay(200 + index * 100).duration(600)}
              exiting={FadeOutUp.duration(300)}
              layout={Layout.springify()}
              className="mb-4"
            >
              <View className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${isEditing ? 'border-primary-500 ring-2 ring-primary-100' : 'border-neutral-200'}`}>
                
                {/* View Mode */}
                {!isEditing ? (
                  <View className="p-4 flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-neutral-900 mb-1">
                        {contact.name || 'Unnamed Contact'}
                      </Text>
                      <Text className="text-sm text-neutral-500">
                        {contact.phoneNumber || 'No phone number'}
                      </Text>
                    </View>
                    <View className="flex-row items-center space-x-2">
                       <TouchableOpacity
                        onPress={() => startEditing(contact)}
                        className="w-9 h-9 rounded-full bg-neutral-100 items-center justify-center mr-2"
                        accessible={true}
                        accessibilityLabel={`Edit ${contact.name}`}
                      >
                        <Pencil size={18} color="#4B5563" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeContact(contact.id)}
                        className="w-9 h-9 rounded-full bg-red-50 items-center justify-center"
                        accessible={true}
                        accessibilityLabel={`Delete ${contact.name}`}
                      >
                        <Trash2 size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* Edit Mode Form */
                  <View className="p-4 bg-primary-50/10">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                        Editing Contact
                      </Text>
                      <TouchableOpacity onPress={cancelEditing}>
                        <X size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>

                    {/* Name Input */}
                    <View className="mb-4">
                      <Text className="text-[11px] uppercase tracking-[2px] font-bold text-neutral-400 mb-2 ml-1">
                        Name
                      </Text>
                      <TextInput
                        value={tempContact?.name}
                        onChangeText={(text) => updateTempContact('name', text)}
                        placeholder="Contact Name"
                        placeholderTextColor="#9CA3AF"
                        className={`bg-white border ${errors.name ? 'border-red-400' : 'border-neutral-200'} rounded-xl px-4 py-3 text-base text-neutral-900`}
                        autoFocus={true}
                      />
                      {errors.name && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.name}</Text>}
                    </View>

                    {/* Phone Input */}
                    <View className="mb-6">
                      <PhoneInput
                        value={tempContact?.phoneNumber || ''}
                        onChangeText={(text) => updateTempContact('phoneNumber', text)}
                        error={errors.phone}
                        label="Phone Number"
                        selectedCountry={tempContact?.country}
                        onCountryChange={updateTempCountry}
                      />
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row space-x-3">
                      <TouchableOpacity 
                        onPress={cancelEditing}
                        className="flex-1 py-3 bg-white border border-neutral-200 rounded-xl items-center"
                      >
                        <Text className="font-semibold text-neutral-600">Cancel</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={saveContact}
                        disabled={isSaving || !canSave}
                        className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${
                          canSave ? 'bg-primary-600' : 'bg-neutral-300'
                        }`}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Save size={18} color="white" className="mr-2" />
                            <Text className="font-bold text-white">Save</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}

        {/* General Error */}
        {errors.general && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex-row items-center"
          >
            <View className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
            <Text className="text-red-600 text-[10px] font-black uppercase tracking-[1px] flex-1">
              {errors.general}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      {!editingId && (
        <Animated.View 
          entering={FadeInDown.delay(300).duration(600)}
          className="absolute right-6"
          style={{ bottom: insets.bottom + 80 }}
        >
          <TouchableOpacity
            onPress={addContact}
            className="w-16 h-16 bg-primary-600 rounded-full items-center justify-center shadow-lg shadow-primary-600/30"
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="Add new contact"
            accessibilityRole="button"
          >
            <Plus size={32} color="#ffffff" strokeWidth={3} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttonText={alert.buttonText}
        onClose={alert.onClose}
        secondaryButtonText={alert.secondaryButtonText}
        onSecondaryPress={alert.onSecondaryPress}
      />
    </View>
  );
}
