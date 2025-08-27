import React, { useState, useEffect, useCallback } from 'react';
import 'boxicons/css/boxicons.min.css';
import '../../views/css/DanhSachBs.css';
import DoctorCard from '../../components/js/forDsBs/DoctorCard';
import FilterSection from '../../components/js/forDsBs/FilterSection';
import Sidebar from '../../components/js/forDsBs/Sidebar';

interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  coSoKham: string;
  chuyenKhoa: string;
  chucVu: string;
  moTaChucVu: string;
  hocVi: string;
  kinhNghiem: number;
  linkAnh: string;
}

interface SelectedFilters {
  specialty?: string;
  position?: string;
  degree?: string;
  experience?: string;
}

const DanhSachBs: React.FC = () => {
  const [activeCenter, setActiveCenter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});

  // Tạo hàm debounce
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Tạo hàm search với debounce
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      try {
        setLoading(true);
        setError(null);

        if (!query.trim()) {
          await fetchDoctors();
          return;
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}/doctors/search?name=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setDoctors(data);
      } catch (err) {
        console.error('Lỗi khi tìm kiếm bác sĩ:', err);
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tìm kiếm bác sĩ');
      } finally {
        setLoading(false);
      }
    }, 500), // Đợi 500ms sau khi người dùng ngừng gõ
    []
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/doctors`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDoctors(data);
      setLoading(false);
    } catch (err) {
      console.error('Lỗi lấy dữ liệu bác sĩ:', err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lấy dữ liệu bác sĩ');
      setLoading(false);
    }
  };

  const handleFilterChange = async (filterType: string, value: string) => {
    try {
      setFilterLoading(true);
      setError(null);
      
      // Cập nhật state để lưu giá trị filter hiện tại
      const newFilters = {
        ...selectedFilters,
        [filterType]: value
      };
      setSelectedFilters(newFilters);

      // Tạo query params từ tất cả các filter
      const queryParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, val]) => {
        if (val && val !== 'Tất cả') {
          queryParams.append(key, val);
        }
      });

      // Thêm facility vào query params nếu có
      if (activeCenter && activeCenter !== 'Tất cả') {
        queryParams.append('facility', activeCenter);
      }

      // Gọi API lọc
      const response = await fetch(`${process.env.REACT_APP_API_URL}/doctors/filter?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error('Lỗi khi lọc:', error);
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lọc danh sách bác sĩ');
    } finally {
      setFilterLoading(false);
    }
  };

  const handleCenterSelect = async (center: string) => {
    try {
      setActiveCenter(center);
      setLoading(true);
      setError(null);

      // Tạo query params từ các filter hiện tại
      const queryParams = new URLSearchParams();
      Object.entries(selectedFilters).forEach(([key, val]) => {
        if (val && val !== 'Tất cả') {
          queryParams.append(key, val);
        }
      });

      // Thêm facility vào query params
      if (center && center !== 'Tất cả') {
        queryParams.append('facility', center);
      }

      // Gọi API lọc với facility mới
      const response = await fetch(`${process.env.REACT_APP_API_URL}/doctors/filter?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDoctors(data);
    } catch (err) {
      console.error('Lỗi khi lọc bác sĩ theo cơ sở:', err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lọc bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-directory">
      <h1 className="directory-title">ĐỘI NGŨ CHUYÊN GIA BÁC SĨ</h1>

      <FilterSection
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      <div className="content-container">
        <Sidebar
          activeCenter={activeCenter}
          onCenterSelect={handleCenterSelect}
        />

        <div className="doctor-grid">
          {loading ? (
            <div>Đang tải...</div>
          ) : filterLoading ? (
            <div>Đang lọc...</div>
          ) : error ? (
            <div className="error-message">Lỗi: {error}</div>
          ) : doctors.length > 0 ? (
            doctors.map((doctor) => (
              <DoctorCard
                id={doctor.id}
                name={doctor.name}
                position={doctor.moTaChucVu}
                imageUrl={doctor.linkAnh}
                specialty={doctor.chuyenKhoa}
                experience={doctor.kinhNghiem}
                hospital={doctor.coSoKham}
              />
            ))
          ) : (
            <p>Không có bác sĩ.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DanhSachBs; 