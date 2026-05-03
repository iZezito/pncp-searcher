import { relations } from "drizzle-orm/relations";
import {
  users,
  emailVerifications,
  passwordResetTokens,
  twoFactorAuthentication,
  itens,
  planilhas,
  itensBusca,
} from "./schema";

export const emailVerificationsRelations = relations(
  emailVerifications,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerifications.userId],
      references: [users.id],
    }),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  emailVerification: one(emailVerifications, {
    fields: [users.id],
    references: [emailVerifications.userId],
  }),
  passwordResetToken: one(passwordResetTokens, {
    fields: [users.id],
    references: [passwordResetTokens.userId],
  }),
  twoFactorAuthentication: one(twoFactorAuthentication, {
    fields: [users.id],
    references: [twoFactorAuthentication.userId],
  }),
  itensBusca: many(itensBusca),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  }),
);

export const twoFactorAuthenticationRelations = relations(
  twoFactorAuthentication,
  ({ one }) => ({
    user: one(users, {
      fields: [twoFactorAuthentication.userId],
      references: [users.id],
    }),
  }),
);

export const itensRelations = relations(itens, ({ one, many }) => ({
  planilha: one(planilhas, {
    fields: [itens.planilhaId],
    references: [planilhas.id],
  }),
  itensBusca: many(itensBusca),
}));

export const planilhasRelations = relations(planilhas, ({ one, many }) => ({
  user: one(users, {
    fields: [planilhas.userId],
    references: [users.id],
  }),
  itens: many(itens),
}));

export const itensBuscaRelations = relations(itensBusca, ({ one }) => ({
  item: one(itens, {
    fields: [itensBusca.itemId],
    references: [itens.id],
  }),
  user: one(users, {
    fields: [itensBusca.userId],
    references: [users.id],
  }),
}));


