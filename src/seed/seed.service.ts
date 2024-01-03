import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interfaces';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapter/axios.adapter';


@Injectable()
export class SeedService {


  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter,
  ){}

  async executeSeed() {
    await this.pokemonModel.deleteMany({}); 

    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');
    
    const poekmonToInsert: { name: string, no: number }[] = [];

    data.results.forEach(async( {name, url }) => {
      const segments = url.split('/');
      const no = +segments[ segments.length - 2 ];

      // const pokemon = await this.pokemonModel.create({ name, no})
      poekmonToInsert.push({name, no});

    });

    await this.pokemonModel.insertMany(poekmonToInsert);
    
    return 'Seed Executed';
  }

}
