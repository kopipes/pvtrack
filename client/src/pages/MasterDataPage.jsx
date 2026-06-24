import { useState } from 'react';
import { Users, Building2, BookUser } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import UsersTab from '../components/masterdata/UsersTab';
import DivisionsTab from '../components/masterdata/DivisionsTab';
import ClientContactsTab from '../components/masterdata/ClientContactsTab';

export default function MasterDataPage() {
  const { isAdmin, isAdminOrManager } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Master Data</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage users, divisions, and client contacts</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="w-auto inline-flex">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="divisions" className="gap-2">
            <Building2 className="h-4 w-4" />
            Divisions
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <BookUser className="h-4 w-4" />
            Client Contacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="divisions">
          <DivisionsTab />
        </TabsContent>
        <TabsContent value="clients">
          <ClientContactsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
