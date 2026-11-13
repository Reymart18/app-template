# PVHAI Accounting System Plan

## Purpose
Develop a basic PVHAI Accounting System for encoding and recording homeowner collections.

## Initial Features

- Search and select homeowner accounts.
- Encode homeowner payment details.
- Save and record collections.
- View recorded collection transactions.

Source of Truth
The PVHAI Accounting System will be the primary source of truth for
collection data. All collection records must originate in this system
first. Other systems, including the PVHAI Homeowner Portal, should use
the data recorded here rather than maintain separate collection records.

## Portal Integration
Eventually integrate the Accounting System with the existing PVHAI Homeowner Portal so recorded payments can be reflected in homeowner accounts and Statements of Account (SOA).

## FoxPro Replacement
The long-term goal is to replace FoxPro's collection-encoding process with the new system.

## Development Approach
Develop and test locally using dummy data first. Integrate with the existing portal only when the system is ready.
