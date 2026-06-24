'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, MapPin, Power, PowerOff } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

interface Area {
  pincode: string;
  city: string;
  state: string;
  isActive: boolean;
}

export default function AreasPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Uttarakhand');
  const [busy, setBusy] = useState(false);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    },
    [router],
  );

  const load = useCallback(async () => {
    try {
      setAreas(await api<Area[]>('/admin/areas'));
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    void load();
  }, [router, load]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/admin/areas', {
        method: 'POST',
        body: JSON.stringify({
          pincode: pincode.trim(),
          city: city.trim(),
          state: state.trim(),
        }),
      });
      toast.success(`Added ${pincode.trim()} (inactive)`);
      setPincode('');
      setCity('');
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(area: Area) {
    const action = area.isActive ? 'deactivate' : 'activate';
    try {
      await api(`/admin/areas/${area.pincode}/${action}`, { method: 'PATCH' });
      toast.success(
        `${area.pincode} ${area.isActive ? 'deactivated' : 'activated'}`,
      );
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Serviceable Areas</h1>
        <p className="subtitle">
          New pincodes start inactive. Activate one to let buyers post RFQs and
          suppliers declare service there.
        </p>
      </div>

      <div className="card">
        <h2>Add a pincode</h2>
        <form onSubmit={onAdd}>
          <div className="row">
            <div style={{ maxWidth: 170 }}>
              <label>Pincode</label>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="263601"
                required
              />
            </div>
            <div>
              <label>City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Almora"
                required
              />
            </div>
            <div>
              <label>State</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
          </div>
          <button className="primary mt" type="submit" disabled={busy}>
            <Plus />
            {busy ? 'Adding…' : 'Add pincode'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>All pincodes</h2>
        {areas.length === 0 ? (
          <div className="empty">
            <MapPin />
            <span>No pincodes yet. Add your first serviceable area above.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pincode</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr key={area.pincode}>
                    <td style={{ fontWeight: 550 }}>{area.pincode}</td>
                    <td>{area.city}</td>
                    <td>{area.state}</td>
                    <td>
                      <span
                        className={`badge ${area.isActive ? 'active' : 'inactive'}`}
                      >
                        {area.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="sm" onClick={() => toggle(area)}>
                          {area.isActive ? <PowerOff /> : <Power />}
                          {area.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
