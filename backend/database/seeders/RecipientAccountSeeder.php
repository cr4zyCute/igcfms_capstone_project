<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RecipientAccount;
use App\Models\FundAccount;

class RecipientAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some fund accounts for collection recipients (use first available or null)
        $generalFund = FundAccount::first();
        $specialFund = FundAccount::skip(1)->first();

        $recipients = [
            // Disbursement Recipients
            [
                'name' => 'ABC Supplies Co.',
                'type' => 'disbursement',
                'contact_person' => 'John Smith',
                'email' => 'john@abcsupplies.com',
                'phone' => '+63-912-345-6789',
                'address' => '123 Business Street, Makati City, Metro Manila',
                'tax_id' => 'TIN-123456789',
                'bank_account' => 'BPI-1234-5678-9012',
                'fund_account_id' => null,
                'status' => 'active',
                'total_transactions' => 0,
                'total_amount' => 0.00
            ],
            [
                'name' => 'XYZ Construction Corp',
                'type' => 'disbursement',
                'contact_person' => 'Maria Garcia',
                'email' => 'maria@xyzconstruction.com',
                'phone' => '+63-917-234-5678',
                'address' => '456 Industrial Avenue, Quezon City, Metro Manila',
                'tax_id' => 'TIN-987654321',
                'bank_account' => 'BDO-9876-5432-1098',
                'fund_account_id' => null,
                'status' => 'active',
                'total_transactions' => 0,
                'total_amount' => 0.00
            ],
            [
                'name' => 'Tech Solutions Inc.',
                'type' => 'disbursement',
                'contact_person' => 'Robert Chen',
                'email' => 'robert@techsolutions.com',
                'phone' => '+63-918-345-6789',
                'address' => '789 Technology Park, Taguig City, Metro Manila',
                'tax_id' => 'TIN-456789123',
                'bank_account' => 'METROBANK-4567-8912-3456',
                'fund_account_id' => null,
                'status' => 'active',
                'total_transactions' => 0,
                'total_amount' => 0.00
            ],
            [
                'name' => 'Office Supplies Plus',
                'type' => 'disbursement',
                'contact_person' => 'Lisa Rodriguez',
                'email' => 'lisa@officesuppliesplus.com',
                'phone' => '+63-919-456-7890',
                'address' => '321 Commerce Street, Pasig City, Metro Manila',
                'tax_id' => 'TIN-789123456',
                'bank_account' => 'RCBC-7891-2345-6789',
                'fund_account_id' => null,
                'status' => 'active',
                'total_transactions' => 0,
                'total_amount' => 0.00
            ],

            // Collection Recipients (Government Funds)
            [
                'name' => 'LGU General Fund',
                'type' => 'collection',
                'contact_person' => 'Finance Officer',
                'email' => 'finance@lgu.gov.ph',
                'phone' => '+63-2-8123-4567',
                'address' => 'City Hall, Main Street, City Center',
                'fund_code' => 'GF-001',
                'description' => 'Primary government operating fund for general municipal operations and services',
                'fund_account_id' => $generalFund ? $generalFund->id : null,
                'status' => 'active',
                'total_transactions' => 0,
                'total_amount' => 0.00
            ],
            [
                'name' => 'Special Education Fund',
                'type' => 'collection',
                'contact_person' => 'Education Director',
                'email' => 'education@lgu.gov.ph',
                'phone' => '+63-2-8234-5678',
                'address' => 'Education Building, School District',
                'fund_code' => 'SEF-002',
                'description' => 'Dedicated fund for educational programs, school improvements, and student scholarships',
                'fund_account_id' => $specialFund ? $specialFund->id : null,
                'status' => 'active',
                'total_transactions' => 0,
                'total_amount' => 0.00
            ],
            [
                'name' => 'Infrastructure Development Fund',
                'type' => 'collection',
                'contact_person' => 'Public Works Director',
                'email' => 'publicworks@lgu.gov.ph',
                'phone' => '+63-2-8345-6789',
                'address' => 'Public Works Department, Government Complex',
                'fund_code' => 'IDF-003',
                'description' => 'Fund for road construction, bridge repairs, and municipal infrastructure projects',
                'fund_account_id' => $generalFund ? $generalFund->id : null,
                'status' => 'active',
                'total_transactions' => 0,
                'total_amount' => 0.00
            ],
            [
                'name' => 'Health Services Fund',
                'type' => 'collection',
                'contact_person' => 'Health Officer',
                'email' => 'health@lgu.gov.ph',
                'phone' => '+63-2-8456-7890',
                'address' => 'Municipal Health Office, Civic Center',
                'fund_code' => 'HSF-004',
                'description' => 'Fund for healthcare services, medical equipment, and public health programs',
                'fund_account_id' => $specialFund ? $specialFund->id : null,
                'status' => 'active',
                'total_transactions' => 0,
                'total_amount' => 0.00
            ]
        ];

        foreach ($recipients as $recipient) {
            RecipientAccount::create($recipient);
        }

        $this->command->info('Recipient accounts seeded successfully!');
    }
}
