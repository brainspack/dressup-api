import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface OutfitType {
  id: string;
  name: string;
  gender: 'female' | 'male';
  category: string;
  // No defaultPrice - prices will be set by user input in AddOrder form
}

@Injectable()
export class OutfitService {
  constructor(private prisma: PrismaService) {}

  // Get all outfit types without default prices
  async getAllOutfitTypes(): Promise<OutfitType[]> {
    try {
      // Return outfit types without default prices
      // Prices will be set by users in the AddOrder form
      const outfitTypes: OutfitType[] = [
        // Female Traditional Wear
        { id: 'f1', name: 'saree', gender: 'female', category: 'Traditional Wear' },
        { id: 'f2', name: 'kurti', gender: 'female', category: 'Traditional Wear' },
        { id: 'f3', name: 'camisole', gender: 'female', category: 'Traditional Wear' },
        { id: 'f4', name: 'ethnic_jacket', gender: 'female', category: 'Traditional Wear' },
        { id: 'f5', name: 'jacket', gender: 'female', category: 'Western Wear' },
        { id: 'f6', name: 'nighty', gender: 'female', category: 'Night Wear' },
        { id: 'f7', name: 'slip', gender: 'female', category: 'Inner Wear' },
        { id: 'f8', name: 'skirt', gender: 'female', category: 'Western Wear' },
        { id: 'f9', name: 'shrug', gender: 'female', category: 'Outerwear' },
        { id: 'f10', name: 'cape', gender: 'female', category: 'Outerwear' },
        { id: 'f11', name: 'top', gender: 'female', category: 'Western Wear' },
        { id: 'f12', name: 'women_western_suit', gender: 'female', category: 'Western Wear' },
        { id: 'f13', name: 'jumpsuit', gender: 'female', category: 'Western Wear' },
        { id: 'f14', name: 'kaftan', gender: 'female', category: 'Traditional Wear' },
        { id: 'f15', name: 'women_blazer', gender: 'female', category: 'Western Wear' },
        { id: 'f16', name: 'women_co_ord_set', gender: 'female', category: 'Western Wear' },
        { id: 'f17', name: 'sharara', gender: 'female', category: 'Traditional Wear' },
        { id: 'f18', name: 'lehenga', gender: 'female', category: 'Traditional Wear' },
        { id: 'f19', name: 'underskirt', gender: 'female', category: 'Traditional Wear' },
        { id: 'f20', name: 'womenssuit', gender: 'female', category: 'Western Wear' },
        { id: 'f21', name: 'gown', gender: 'female', category: 'Western Wear' },
        { id: 'f22', name: 'saree+blouse', gender: 'female', category: 'Traditional Wear' },
        { id: 'f23', name: 'dress', gender: 'female', category: 'Western Wear' },
        { id: 'f24', name: 'co_ord_set', gender: 'female', category: 'Western Wear' },
        { id: 'f25', name: 'tshirt', gender: 'female', category: 'Western Wear' },

        // Male Traditional Wear
        { id: 'm1', name: 'dhoti', gender: 'male', category: 'Traditional Wear' },
        { id: 'm2', name: 'pajama', gender: 'male', category: 'Traditional Wear' },
        { id: 'm3', name: 'kurta', gender: 'male', category: 'Traditional Wear' },
        { id: 'm4', name: 'blazer', gender: 'male', category: 'Western/Formal Wear' },
        { id: 'm5', name: 'indo_western', gender: 'male', category: 'Fusion Wear' },
        { id: 'm6', name: 'sherwani', gender: 'male', category: 'Traditional Wear' },
        { id: 'm7', name: 'waistcost', gender: 'male', category: 'Traditional Wear' },
        { id: 'm8', name: 'nehrujacket', gender: 'male', category: 'Traditional Wear' },
        { id: 'm9', name: 'shirt (1)', gender: 'male', category: 'Western/Formal Wear' },
        { id: 'm10', name: 'pants', gender: 'male', category: 'Western/Formal Wear' },
        { id: 'm11', name: 'kurta_pajama', gender: 'male', category: 'Traditional Wear' },
      ];

      return outfitTypes;
    } catch (error) {
      console.error('Error fetching outfit types:', error);
      throw new InternalServerErrorException('Failed to fetch outfit types');
    }
  }

  // Get outfit type by name
  async getOutfitTypeByName(name: string): Promise<OutfitType | null> {
    try {
      const outfitTypes = await this.getAllOutfitTypes();
      return outfitTypes.find(outfit => outfit.name === name) || null;
    } catch (error) {
      console.error('Error fetching outfit type by name:', error);
      throw new InternalServerErrorException('Failed to fetch outfit type');
    }
  }

  // Get outfit types by gender
  async getOutfitTypesByGender(gender: 'female' | 'male'): Promise<OutfitType[]> {
    try {
      const outfitTypes = await this.getAllOutfitTypes();
      return outfitTypes.filter(outfit => outfit.gender === gender);
    } catch (error) {
      console.error('Error fetching outfit types by gender:', error);
      throw new InternalServerErrorException('Failed to fetch outfit types by gender');
    }
  }
}
