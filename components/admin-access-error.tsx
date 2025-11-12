"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AdminAccessError() {
  const searchParams = useSearchParams();
  
  if (searchParams.get('error') !== 'admin_required') {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-destructive">Access Denied</CardTitle>
          <CardDescription>
            You need administrator privileges to access the Users Management page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
