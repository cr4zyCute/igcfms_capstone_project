<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        // $this->call([
        //     UserSeeder::class,
        // ]);


        //Admin
        User::create([
            'email' => 'admin@gmail.com',
            'password' => Hash::make('admin'),
            'role' => 'Admin',
            'name' => 'System Administrator'
        ]);
        //Collector Officer 
        User::create([
            'email' => 'collector@gmail.com',
            'password' => Hash::make('collector123'),
            'role' => 'Collecting Officer',
            'name' => 'Jhoneca Jungoy',
        ]);
        //Disbursing Officer
        User::create([
            'email' => 'disburser@gmail.com',
            'password' => Hash::make('disburser123'),
            'role' => 'Disbursing Officer',
            'name' => 'Ian Jane Butaslac',
        ]);
        //Cashier
        User::create([
            'email' => 'cashier@gmail.com',
            'password' => Hash::make('cashier123'),
            'role' => 'Cashier',
            'name' => 'Marvic Pajaganas',
        ]);

        // Call other seeders
        $this->call([
            RecipientAccountSeeder::class,
        ]);
    }
}
