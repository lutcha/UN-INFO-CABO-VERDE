# UN INFO Cabo Verde — painel público

Vista de leitura dos dados do UN INFO para o Quadro de Cooperação ONU–Cabo Verde 2023–2027.
Os valores oficiais são os do UN INFO (uninfo.org); este painel só os organiza.

- `index.html` — painel financeiro por agência e por sub-produto
- `indicadores.html` — estado dos indicadores face às metas de 2027, completude e qualidade dos dados
- `evolucao.html` — evolução entre exportações (pasta `historico/`)

**Versão pública sem nomes de pessoas.** A coluna de pontos focais está vazia e os nomes nas descrições
dos indicadores foram substituídos por «[ponto focal]». A versão completa é mantida num repositório privado.

Para publicar novos exports aqui, coloque-os primeiro no repositório interno e depois corra:

```
python3 scripts/anonimizar.py .          # retira os nomes
python3 scripts/anonimizar.py . --check  # confirma que não ficou nenhum (sai com erro se ficou)
```
