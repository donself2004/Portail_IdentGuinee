import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * TEST COMPONENT - Insérer des données de test dans Supabase
 * Utilisez ce composant pour remplir la table naissancechain avec des données de test
 */
export default function TestDataManager() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testData = [
    {
      id_acte: '001/RC/CK/2026',
      nom: 'Barry',
      prenom: 'Diariou',
      date_naissance: '12/05/1992',
      lieu_naissance: 'Conakry',
      nom_pere: 'Mamadou DIALLO',
      nom_mere: 'Aissata KONE'
    },
    {
      id_acte: '002/RC/MATAM/2023',
      nom: 'SOW',
      prenom: 'Ahmed',
      date_naissance: '15/03/1990',
      lieu_naissance: 'Mamou',
      nom_pere: 'Ousmane SOW',
      nom_mere: 'Hawa DIALLO'
    },
    {
      id_acte: '003/RC/KINDIA/2024',
      nom: 'Kamara',
      prenom: 'Marie',
      date_naissance: '22/07/1995',
      lieu_naissance: 'Kindia',
      nom_pere: 'Ibrahim KAMARA',
      nom_mere: 'Awa TOURE'
    }
  ];

  const insertTestData = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Vérifier les données existantes
      const { data: existingData, error: checkError } = await supabase
        .from('naissancechain')
        .select('*')
        .in('id_acte', testData.map(d => d.id_acte));

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Insérer les nouvelles données
      const { data, error: insertError } = await supabase
        .from('naissancechain')
        .insert(testData)
        .select();

      if (insertError) {
        throw insertError;
      }

      setResult({
        success: true,
        message: `${data?.length || testData.length} enregistrements insérés avec succès!`,
        data: data
      });
    } catch (err) {
      console.error('Erreur lors de l\'insertion:', err);
      setError({
        message: err.message || 'Erreur inconnue',
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  const checkData = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('naissancechain')
        .select('*')
        .limit(10);

      if (fetchError) {
        throw fetchError;
      }

      setResult({
        success: true,
        message: `${data?.length || 0} enregistrements trouvés`,
        data: data
      });
    } catch (err) {
      console.error('Erreur lors de la lecture:', err);
      setError({
        message: err.message || 'Erreur inconnue',
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  const clearTestData = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer les données de test?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: deleteError } = await supabase
        .from('naissancechain')
        .delete()
        .in('id_acte', testData.map(d => d.id_acte))
        .select();

      if (deleteError) {
        throw deleteError;
      }

      setResult({
        success: true,
        message: `${data?.length || testData.length} enregistrements supprimés`,
        data: data
      });
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError({
        message: err.message || 'Erreur inconnue',
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginTop: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h3>🧪 Gestionnaire de données de test</h3>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={insertTestData}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#006D44',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Insertion...' : '✅ Insérer données de test'}
        </button>

        <button
          onClick={checkData}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#0066CC',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Lecture...' : '🔍 Vérifier les données'}
        </button>

        <button
          onClick={clearTestData}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#C92A2A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Suppression...' : '🗑️ Supprimer données de test'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#FFE3E3',
          borderLeft: '4px solid #C92A2A',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <strong>❌ Erreur:</strong> {error.message}
          {error.details && (
            <pre style={{ marginTop: '10px', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(error.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: result.success ? '#D3F9D8' : '#FFF3BF',
          borderLeft: `4px solid ${result.success ? '#2F9E44' : '#F08C00'}`,
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <strong>{result.success ? '✅' : '⚠️'} {result.message}</strong>
          {result.data && (
            <pre style={{ marginTop: '10px', fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div style={{
        marginTop: '15px',
        padding: '15px',
        backgroundColor: '#E3F2FD',
        borderRadius: '4px'
      }}>
        <strong>📋 Données de test disponibles:</strong>
        <ul style={{ marginTop: '10px', fontSize: '13px' }}>
          {testData.map((item) => (
            <li key={item.id_acte}>
              <strong>{item.id_acte}</strong> - {item.prenom} {item.nom} ({item.date_naissance})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
