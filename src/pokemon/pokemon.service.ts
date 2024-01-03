import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import { Model, isValidObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {
  private defaultLimit: number;
  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,
    private readonly consigService: ConfigService,
  ){
    this.defaultLimit = consigService.get<number>('defaultLimit');
  }


  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      const pokemon = await this.pokemonModel.create( createPokemonDto );
      return pokemon;
      
    } catch (error) {
      this.handleExceptions(error);
     
    }
  }

  findAll( paginationDto: PaginationDto) {

    const {limit = this.defaultLimit, offset = 0} = paginationDto;
    return this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({
        no:1
      })
      .select('-__v');
  }

  async findOne(id: string) {
    let pokemon: Pokemon;
    if (!isNaN(+id)) {
      pokemon = await this.pokemonModel.findOne({ no: id });
    }

    if ( !pokemon && isValidObjectId( id )) {
        pokemon = await this.pokemonModel.findById( id );
    }

    if ( !pokemon ){
      pokemon = await this.pokemonModel.findOne({ name: id.toLocaleLowerCase().trim( )})
    }

    if ( !pokemon )
    throw new NotFoundException(`EL pokemon con el id, nombre, o no "${ id }" no encontrado`);
    return pokemon;
  }

  async update(id: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne( id );

    if ( updatePokemonDto.name ) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }
    
    try {
      await pokemon.updateOne( updatePokemonDto );
      return {...pokemon.toJSON(), ...updatePokemonDto};

    } catch (error) {
      this.handleExceptions(error);
    }


 };

  async remove(id: string ) {

    // doble consulta
    // const pokemon = await this.findOne( id );
    // await pokemon.deleteOne();


    // const result = await this.pokemonModel.findByIdAndDelete( id );
    
    const {deletedCount} = await this.pokemonModel.deleteOne({ _id: id});

    if (deletedCount === 0) {
      throw new BadRequestException( `El pokemon con el id: "${id}" no existe`);
    }


    return;
  }

  private handleExceptions (error: any){
    if ( error.code === 11000 ) {
      throw new BadRequestException(`El pokemon ya existe en la Bd ${ JSON.stringify( error.keyValue ) }`);
    }
    console.log(error);
    throw new InternalServerErrorException(`No se puede crear el Pokemno - Revisar los logs del servidor`);
    
  }
}
