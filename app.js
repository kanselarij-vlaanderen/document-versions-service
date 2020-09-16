import { app, query, update, errorHandler, sparqlEscapeString, sparqlEscapeUri } from 'mu';

const KANSELARIJ_GRAPH = 'http://mu.semte.ch/graphs/organizations/kanselarij';

/**
 * Add a document to the collection of documents of an agendaitem.
 * If the agendaitem already contains a previous version of the document -copied from the previous agenda on agenda approval-
 * the previous version gets replaced with the new version. Otherwise the new version is just added to the agendaitem's documents.
*/
app.put('/agendaitems/:id/documents', async function( req, res, next ) {
  const documentId = req.body.data && req.body.data.id;
  const agendaitemId = req.params.id;
  try {
    // Get previousDocument if it's also linked to the corresponding agendaitem on the previous agenda
    let result = await query(`
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
      PREFIX dossier: <https://data.vlaanderen.be/ns/dossier#>
      PREFIX besluitvorming: <http://data.vlaanderen.be/ns/besluitvorming#>
      PREFIX dct: <http://purl.org/dc/terms/>
      PREFIX prov: <http://www.w3.org/ns/prov#>
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
      SELECT ?agendaitem ?previousDocument
      WHERE {
         GRAPH <${KANSELARIJ_GRAPH}> {
            ?newDocument mu:uuid ${sparqlEscapeString(documentId)} .
            ?documentContainer dossier:collectie.bestaatUit ?newDocument .

            ?agendaitem mu:uuid ${sparqlEscapeString(agendaitemId)} ;
                        prov:wasRevisionOf ?previousAgendaitem .
            ?agendaitem besluitvorming:geagendeerdStuk ?previousDocument .
            ?previousAgendaitem besluitvorming:geagendeerdStuk ?previousDocument .
            ?documentContainer dossier:collectie.bestaatUit ?previousDocument .
         }
      }
    `);

    // Remove the previousDocument from the current agendaitem (if any)
    for (let binding of result.results.bindings) {
      const agendaitem = binding['agendaitem'].value;
      const previousDocument = binding['previousDocument'].value;
      console.log(`Remove previous document <${previousDocument}> from agendaitem <${agendaitem}>. It will be replaced with a new version.`);
      await update(`
      PREFIX besluitvorming: <http://data.vlaanderen.be/ns/besluitvorming#>
      DELETE DATA {
         GRAPH <${KANSELARIJ_GRAPH}> {
           ${sparqlEscapeUri(agendaitem)} besluitvorming:geagendeerdStuk ${sparqlEscapeUri(previousDocument)} .
         }
      }
    `);
    }

    // Link the new document to the agendaitem
    console.log(`Add new document ${documentId} to agendaitem ${agendaitemId}.`);
    await update(`
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
      PREFIX besluitvorming: <http://data.vlaanderen.be/ns/besluitvorming#>
      INSERT {
          GRAPH <${KANSELARIJ_GRAPH}> {
            ?agendaitem besluitvorming:geagendeerdStuk ?newDocument .
          }
      } WHERE {
          GRAPH <${KANSELARIJ_GRAPH}> {
            ?newDocument mu:uuid ${sparqlEscapeString(documentId)} .
            ?agendaitem mu:uuid ${sparqlEscapeString(agendaitemId)} .
          }
      }
  `);

    res.status(204).send();
  } catch (ex) {
    console.log(`Something went wrong while updating document ${documentId} on agendaitem ${agendaitemId}`);
    console.trace(ex);
    const error = {
      status: 500,
      message: ex.message || ex.title || `${ex}`
    };
    next(error);
  }
} );

app.use(errorHandler);
