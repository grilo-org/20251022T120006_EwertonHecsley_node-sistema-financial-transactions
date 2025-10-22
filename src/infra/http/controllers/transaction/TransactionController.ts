import { CategoryRepository } from '@/core/domain/category/repository/CategoryRepository';
import { TransactionRepository } from '@/core/domain/transaction/repository/TransictionRepository';
import { CreateTransactionUseCase } from '@/core/domain/transaction/use-case/Create';
import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateTransactionDto } from './dto/schemaTransactionDto';
import { getUserIdOrThrow } from '@/shared/utils/getUserIdOrThrow';
import { logger } from '@/shared/utils/logger';
import { TransactionPresenter } from './presenter/TransactionPresenter';
import { ListAllTransactions } from '@/core/domain/transaction/use-case/List';
import { UserRepository } from '@/core/domain/user/repository/UserRepository';
import { NotFound } from '@/shared/errors/custom/NorFound';
import { FindTransactionUseCase } from '@/core/domain/transaction/use-case/Find';
import { schemaTransactionParamsDto } from './dto/schemaParamsTransactionDto';
import { UpdateTransactionUseCase } from '@/core/domain/transaction/use-case/Update';
import { UpdateTransactionDto } from './dto/schemaTransactionUpdateDto';
import { DeleteTransactionUseCase } from '@/core/domain/transaction/use-case/Delete';
import { ExtractUseCase } from '@/core/domain/transaction/use-case/Extract';

export class TransactionController {
  private readonly create: CreateTransactionUseCase;
  private readonly listAll: ListAllTransactions;
  private readonly find: FindTransactionUseCase;
  private readonly save: UpdateTransactionUseCase;
  private readonly delete: DeleteTransactionUseCase;
  private readonly extractUser: ExtractUseCase;

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
  ) {
    this.create = new CreateTransactionUseCase(this.transactionRepository, this.categoryRepository);
    this.listAll = new ListAllTransactions(
      this.transactionRepository,
      this.userRepository,
      this.categoryRepository,
    );
    this.find = new FindTransactionUseCase(
      this.transactionRepository,
      this.userRepository,
      this.categoryRepository,
    );
    this.save = new UpdateTransactionUseCase(
      this.transactionRepository,
      this.userRepository,
      this.categoryRepository,
    );
    this.delete = new DeleteTransactionUseCase(this.transactionRepository, this.userRepository);
    this.extractUser = new ExtractUseCase(this.transactionRepository, this.userRepository);
  }

  async store(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const props = request.body as CreateTransactionDto;
    const user_id = getUserIdOrThrow(request, reply);
    if (!user_id) return;

    const result = await this.create.execute({ ...props, user_id });
    if (result.isLeft()) {
      logger.error('Erro create transaction.');
      const { statusCode, message } = result.value;
      reply.status(statusCode).send({ message });
      return;
    }

    reply.status(201).send({
      message: 'Created transaction sucessfully.',
      transaction: TransactionPresenter.toHTTP(result.value.transaction, result.value.category),
    });
    logger.info('Created transaction sucessfully.');
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user_id = getUserIdOrThrow(request, reply);
    if (!user_id) return;

    const filter = (request.query as { filter?: string }).filter;

    const result = await this.listAll.execute({ user_id, filter });

    if (result.isLeft()) {
      logger.error('Error listing transactions.');
      const { statusCode, message } = result.value;
      reply.status(statusCode).send({ message });
      return;
    }

    reply.status(200).send({
      message: 'Listed transactions successfully.',
      transactions: result.value.map(T =>
        TransactionPresenter.toHTTP(T.transaction, T.categgory),
      ),
    });
    logger.info('Listed transactions successfully.');
  }


  async index(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user_id = getUserIdOrThrow(request, reply);
    if (!user_id) return;

    const paramsValidate = schemaTransactionParamsDto.safeParse(request.params);
    if (!paramsValidate.success) {
      reply.status(400).send({ message: 'Invalid params for transaction.' });
      return;
    }

    const { id } = paramsValidate.data;

    const result = await this.find.execute({ id, user_id });
    if (result.isLeft()) {
      logger.error('Error finding transaction.');
      const { statusCode, message } = result.value;
      reply.status(statusCode).send({ message });
      return;
    }

    reply.status(200).send({
      message: 'Found transaction sucessfully.',
      transaction: TransactionPresenter.toHTTP(result.value.transaction, result.value.category),
    });
    logger.info('Found transaction sucessfully.');
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user_id = getUserIdOrThrow(request, reply);
    if (!user_id) return;

    const paramsValidate = schemaTransactionParamsDto.safeParse(request.params);
    if (!paramsValidate.success) {
      reply.status(400).send({ message: 'Invalid params for transaction.' });
      return;
    }

    const { id } = paramsValidate.data;
    const props = request.body as UpdateTransactionDto;

    const result = await this.save.execute({
      id,
      user_id,
      ...props,
      date: props.date ? new Date(props.date) : undefined,
    });
    if (result.isLeft()) {
      logger.error('Error updating transaction.');
      const { statusCode, message } = result.value;
      reply.status(statusCode).send({ message });
      return;
    }

    reply.status(200).send({
      message: 'Updated transaction sucessfully.',
    });
    logger.info('Updated transaction sucessfully.');
  }

  async destroy(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user_id = getUserIdOrThrow(request, reply);
    if (!user_id) return;

    const paramsValidate = schemaTransactionParamsDto.safeParse(request.params);
    if (!paramsValidate.success) {
      reply.status(400).send({ message: 'Invalid params for transaction.' });
      return;
    }

    const { id } = paramsValidate.data;

    const result = await this.delete.execute({ id, user_id });
    if (result.isLeft()) {
      logger.error('Error deleting transaction.');
      const { statusCode, message } = result.value;
      reply.status(statusCode).send({ message });
      return;
    }

    reply.status(204).send();
    logger.info('Deleted transaction sucessfully.');
  }

  async extract(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user_id = getUserIdOrThrow(request, reply);
    if (!user_id) return;

    const result = await this.extractUser.execute({ user_id });
    if (result.isLeft()) {
      logger.error('Error extracting transactions.');
      const { statusCode, message } = result.value;
      reply.status(statusCode).send({ message });
      return;
    }

    reply.status(200).send({
      message: 'Extracted transactions sucessfully.',
      entrada: result.value.entrada,
      saida: result.value.saida,
    });
    logger.info('Extracted transactions sucessfully.');
  }
}
