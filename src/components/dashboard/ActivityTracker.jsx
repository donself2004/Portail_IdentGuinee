import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './ActivityTracker.css';

const ActivityItem = ({ title, id, status, percentage, statusType }) => {
  return (
    <div className="activity-item">
      <div className={`status-dot ${statusType}`}></div>
      <div className="activity-details">
        <h4 className="activity-title">{title}</h4>
        <p className="activity-meta">Dossier #{id} • {status}</p>
      </div>
      {percentage && (
        <div className="activity-badge progress">
          <span>{percentage}% COMPLÉTÉ</span>
        </div>
      )}
      {statusType === 'action' && (
        <div className="activity-badge action">
          ACTION REQUISE
        </div>
      )}
      {statusType === 'archived' && (
        <div className="activity-badge archived">
          Archivé
        </div>
      )}
    </div>
  );
};

const ActivityTracker = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user?.id) {
        setActivities([]);
        return;
      }

      const { data } = await supabase
        .from('documents_certifies')
        .select('id, id_acte, statut_demande, statut, created_at, date_generation')
        .eq('citoyen_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const mappedActivities = (data || []).map((doc) => {
        const statutValue = (doc.statut || '').toUpperCase();
        const statutDemandeValue = (doc.statut_demande || '').toUpperCase();
        const isGenerated =
          statutValue === 'GENERE' ||
          statutValue === 'GÉNÉRÉ' ||
          statutDemandeValue === 'TERMINEE' ||
          statutDemandeValue === 'TERMINÉE';
        return {
          title: doc.id_acte ? `Acte ${doc.id_acte}` : "Document certifié",
          id: doc.id,
          status: isGenerated ? 'Terminée' : (doc.statut_demande || 'En attente'),
          statusType: isGenerated ? 'archived' : 'progress',
          percentage: isGenerated ? null : 80
        };
      });

      setActivities(mappedActivities);
    };

    fetchActivities();
  }, [user?.id]);

  return (
    <div className="activity-tracker">
      <h3 className="section-title">Suivi des activités</h3>
      <div className="activity-list">
        {activities.length === 0 && (
          <p className="activity-meta">Aucune activité récente</p>
        )}
        {activities.map((activity, index) => (
          <ActivityItem key={index} {...activity} />
        ))}
      </div>
    </div>
  );
};

export default ActivityTracker;
